import type {
  Subscription,
  PaymentRecord,
  Stats,
  Currency,
  Category,
  BudgetSettings,
  WorthScore,
  UpcomingRenewal,
} from "@/types";

/**
 * IndexedDB-backed data layer for CindR v2.
 *
 * Privacy: zero network requests. Export uses Blob download.
 */

const DB_NAME = "cindr";
const DB_VERSION = 2;
const SUB_STORE = "subscriptions";
const PAY_STORE = "payments";
const SETTINGS_STORE = "settings";

/* ------------------------------------------------------------------ */
/*  IndexedDB helpers                                                  */
/* ------------------------------------------------------------------ */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // v1: subscriptions
      if (!db.objectStoreNames.contains(SUB_STORE)) {
        const os = db.createObjectStore(SUB_STORE, { keyPath: "id" });
        os.createIndex("nextRenewal", "nextRenewal");
        os.createIndex("cancelled", "cancelled");
        os.createIndex("category", "category");
      }
      // v2: payments
      if (!db.objectStoreNames.contains(PAY_STORE)) {
        const ps = db.createObjectStore(PAY_STORE, { keyPath: "id" });
        ps.createIndex("subscriptionId", "subscriptionId");
        ps.createIndex("date", "date");
      }
      // v2: settings
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new Error(`IndexedDB open failed: ${req.error?.message}`));
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        t.oncomplete = () => resolve(undefined as unknown as T);
        t.onerror = () =>
          reject(new Error(`Transaction failed: ${t.error?.message}`));
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () =>
          reject(new Error(`Request failed: ${req.error?.message}`));
      })
      .catch(reject);
  });
}

/* ------------------------------------------------------------------ */
/*  Reactivity                                                        */
/* ------------------------------------------------------------------ */

let listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/* ------------------------------------------------------------------ */
/*  Subscription CRUD                                                  */
/* ------------------------------------------------------------------ */

export async function listSubscriptions(): Promise<Subscription[]> {
  const subs: Subscription[] = await tx(SUB_STORE, "readonly", (s) =>
    s.getAll(),
  );
  return subs.sort(
    (a, b) => +new Date(a.nextRenewal) - +new Date(b.nextRenewal),
  );
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
  return tx(SUB_STORE, "readonly", (s) => s.get(id));
}

export async function addSubscription(
  data: Omit<Subscription, "id" | "createdAt" | "cancelled">,
): Promise<Subscription> {
  const sub: Subscription = {
    ...data,
    id: crypto.randomUUID(),
    cancelled: false,
    createdAt: new Date().toISOString(),
    worthScore: data.worthScore ?? 3,
    worthUpdatedAt: data.worthUpdatedAt ?? new Date().toISOString(),
    previousAmounts: data.previousAmounts ?? [],
  };
  await tx(SUB_STORE, "readwrite", (s) => s.add(sub));
  notify();
  return sub;
}

export async function updateSubscription(
  id: string,
  patch: Partial<Subscription>,
): Promise<void> {
  const existing: Subscription | undefined = await tx(SUB_STORE, "readonly", (s) =>
    s.get(id),
  );
  if (!existing) return;

  // Track price changes
  if (
    patch.amount !== undefined &&
    patch.amount !== existing.amount
  ) {
    const changes = existing.previousAmounts ?? [];
    changes.push({
      amount: existing.amount,
      date: new Date().toISOString(),
      cycle: existing.billingCycle,
    });
    patch.previousAmounts = changes;
  }

  await tx(SUB_STORE, "readwrite", (s) =>
    s.put({ ...existing, ...patch }),
  );
  notify();
}

export async function cancelSubscription(id: string): Promise<void> {
  await updateSubscription(id, {
    cancelled: true,
    cancelledAt: new Date().toISOString(),
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  // Clean up payments
  const payments = await listPayments(id);
  for (const p of payments) {
    await tx(PAY_STORE, "readwrite", (s) => s.delete(p.id));
  }
  await tx(SUB_STORE, "readwrite", (s) => s.delete(id));
  notify();
}

/* ------------------------------------------------------------------ */
/*  Worth Score                                                        */
/* ------------------------------------------------------------------ */

export async function setWorthScore(
  subscriptionId: string,
  rating: number,
): Promise<void> {
  await updateSubscription(subscriptionId, {
    worthScore: rating,
    worthUpdatedAt: new Date().toISOString(),
  });
}

/* ------------------------------------------------------------------ */
/*  Payment History                                                    */
/* ------------------------------------------------------------------ */

export async function logPayment(
  subscriptionId: string,
  amount: number,
  currency: Currency,
  billingCycle: PaymentRecord["billingCycle"],
): Promise<PaymentRecord> {
  const record: PaymentRecord = {
    id: crypto.randomUUID(),
    subscriptionId,
    amount,
    currency,
    date: new Date().toISOString(),
    billingCycle,
  };
  await tx(PAY_STORE, "readwrite", (s) => s.add(record));

  // Update subscription nextRenewal
  const sub = await getSubscription(subscriptionId);
  if (sub && !sub.cancelled) {
    const next = new Date(sub.nextRenewal);
    switch (billingCycle) {
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "custom":
        if (sub.customDays && sub.customDays > 0) {
          next.setDate(next.getDate() + sub.customDays);
        } else {
          next.setMonth(next.getMonth() + 1);
        }
        break;
    }
    await updateSubscription(subscriptionId, { nextRenewal: next.toISOString() });
  }

  notify();
  return record;
}

export async function listPayments(
  subscriptionId?: string,
): Promise<PaymentRecord[]> {
  const all: PaymentRecord[] = await tx(PAY_STORE, "readonly", (s) => s.getAll());
  const filtered = subscriptionId
    ? all.filter((p) => p.subscriptionId === subscriptionId)
    : all;
  return filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getPaymentTotal(subscriptionId?: string): Promise<number> {
  const payments = await listPayments(subscriptionId);
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

/* ------------------------------------------------------------------ */
/*  Budget Settings                                                    */
/* ------------------------------------------------------------------ */

const BUDGET_KEY = "budget";

export async function getBudget(): Promise<BudgetSettings | null> {
  const entry = await tx<{ key: string; value: BudgetSettings } | undefined>(
    SETTINGS_STORE,
    "readonly",
    (s) => s.get(BUDGET_KEY),
  );
  return entry?.value ?? null;
}

export async function saveBudget(settings: BudgetSettings): Promise<void> {
  await tx(SETTINGS_STORE, "readwrite", (s) =>
    s.put({ key: BUDGET_KEY, value: settings }),
  );
  notify();
}

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

function monthlyEquivalent(s: Subscription): number {
  if (s.cancelled) return 0;
  switch (s.billingCycle) {
    case "monthly":
      return s.amount;
    case "yearly":
      return s.amount / 12;
    case "quarterly":
      return s.amount / 3;
    case "weekly":
      return s.amount * (52 / 12);
    case "custom":
      return s.customDays && s.customDays > 0
        ? s.amount * (30 / s.customDays)
        : s.amount;
  }
}

function daysUntil(dateStr: string): number {
  return Math.ceil((+new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24));
}

export async function getStats(): Promise<Stats> {
  const subs = await listSubscriptions();
  const active = subs.filter((s) => !s.cancelled);
  const cancelled = subs.filter((s) => s.cancelled);
  const monthly = active.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  const now = Date.now();
  const in30 = now + 30 * 24 * 60 * 60 * 1000;

  const renewalsNext30 = active.filter((s) => {
    const t = +new Date(s.nextRenewal);
    return t >= now && t <= in30;
  }).length;

  const monthlySaved = cancelled.reduce(
    (sum, s) => sum + monthlyEquivalent(s),
    0,
  );
  const currency: Currency = (active[0]?.currency ?? "GBP") as Currency;

  const categoryBreakdown: Record<Category, number> = {
    Entertainment: 0,
    Software: 0,
    Cloud: 0,
    Utilities: 0,
    Finance: 0,
    Health: 0,
    Education: 0,
    Other: 0,
  };
  for (const s of active) {
    categoryBreakdown[s.category] += monthlyEquivalent(s);
  }

  // Budget
  const budget = await getBudget();
  const budgetUsage = budget ? monthly / budget.monthlyLimit : undefined;

  // Worth score
  const scoredSubs = active.filter((s) => s.worthScore !== undefined);
  const avgWorthScore =
    scoredSubs.length > 0
      ? scoredSubs.reduce((sum, s) => sum + (s.worthScore ?? 0), 0) /
        scoredSubs.length
      : undefined;

  // Payment total
  const paymentTotal = await getPaymentTotal();

  // Upcoming renewals (next 90 days, sorted)
  const in90 = now + 90 * 24 * 60 * 60 * 1000;
  const upcomingRenewals: UpcomingRenewal[] = active
    .filter((s) => {
      const t = +new Date(s.nextRenewal);
      return t >= now && t <= in90;
    })
    .map((s) => ({
      subscriptionId: s.id,
      name: s.name,
      amount: monthlyEquivalent(s),
      currency: s.currency,
      date: s.nextRenewal,
      daysUntil: daysUntil(s.nextRenewal),
      category: s.category,
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    monthly,
    yearly: monthly * 12,
    active: active.length,
    renewalsNext30,
    monthlySaved,
    cancelledCount: cancelled.length,
    currency,
    categoryBreakdown,
    budget: budget ?? undefined,
    budgetUsage,
    avgWorthScore,
    paymentTotal,
    upcomingRenewals,
  };
}

/* ------------------------------------------------------------------ */
/*  Export / Import                                                    */
/* ------------------------------------------------------------------ */

export async function exportData(): Promise<string> {
  const subs = await listSubscriptions();
  const payments = await listPayments();
  const budget = await getBudget();
  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      subscriptions: subs,
      payments,
      budget,
    },
    null,
    2,
  );
}

export async function importData(json: string): Promise<number> {
  let data: {
    subscriptions: Subscription[];
    payments?: PaymentRecord[];
    budget?: BudgetSettings;
  };
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format");
  }

  if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
    throw new Error('Invalid format: expected { "subscriptions": [...] }');
  }

  let imported = 0;
  for (const sub of data.subscriptions) {
    if (sub.id && sub.name && typeof sub.amount === "number") {
      const existing: Subscription | undefined = await tx(
        SUB_STORE,
        "readonly",
        (s) => s.get(sub.id),
      );
      if (!existing) {
        await tx(SUB_STORE, "readwrite", (s) => s.add(sub));
        imported++;
      }
    }
  }

  // Restore payments
  if (data.payments) {
    for (const p of data.payments) {
      const existing = await tx<PaymentRecord | undefined>(
        PAY_STORE,
        "readonly",
        (s) => s.get(p.id),
      );
      if (!existing) {
        await tx(PAY_STORE, "readwrite", (s) => s.add(p));
      }
    }
  }

  // Restore budget
  if (data.budget) {
    await saveBudget(data.budget);
  }

  notify();
  return imported;
}
