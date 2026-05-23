import type { Subscription, Stats, Currency } from "@/types";

/**
 * IndexedDB-backed data layer for CindR.
 *
 * Replaces the in-memory placeholder. Same public API so no
 * component or hook changes are needed. Data persists across
 * sessions and never leaves the browser.
 *
 * Privacy: zero network requests. Export uses Blob download.
 */

const DB_NAME = "cindr";
const DB_VERSION = 1;
const STORE = "subscriptions";

/* ------------------------------------------------------------------ */
/*  IndexedDB helpers                                                  */
/* ------------------------------------------------------------------ */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("nextRenewal", "nextRenewal");
        os.createIndex("cancelled", "cancelled");
        os.createIndex("category", "category");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new Error(`IndexedDB open failed: ${req.error?.message}`));
  });
}

function tx(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<any> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        t.oncomplete = () => resolve(undefined);
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
/*  Reactivity (pub/sub — same contract as the in-memory version)      */
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
/*  CRUD                                                               */
/* ------------------------------------------------------------------ */

export async function listSubscriptions(): Promise<Subscription[]> {
  const subs: Subscription[] = await tx("readonly", (s) => s.getAll());
  return subs.sort(
    (a, b) => +new Date(a.nextRenewal) - +new Date(b.nextRenewal),
  );
}

export async function addSubscription(
  data: Omit<Subscription, "id" | "createdAt" | "cancelled">,
): Promise<Subscription> {
  const sub: Subscription = {
    ...data,
    id: crypto.randomUUID(),
    cancelled: false,
    createdAt: new Date().toISOString(),
  };
  await tx("readwrite", (s) => s.add(sub));
  notify();
  return sub;
}

export async function updateSubscription(
  id: string,
  patch: Partial<Subscription>,
): Promise<void> {
  const existing: Subscription | undefined = await tx("readonly", (s) =>
    s.get(id),
  );
  if (!existing) return;
  await tx("readwrite", (s) => s.put({ ...existing, ...patch }));
  notify();
}

export async function cancelSubscription(id: string): Promise<void> {
  await updateSubscription(id, {
    cancelled: true,
    cancelledAt: new Date().toISOString(),
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
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
    Entertainment: 0, Software: 0, Cloud: 0, Utilities: 0,
    Finance: 0, Health: 0, Education: 0, Other: 0,
  };
  for (const s of active) {
    categoryBreakdown[s.category] += monthlyEquivalent(s);
  }
  return {
    monthly,
    yearly: monthly * 12,
    active: active.length,
    renewalsNext30,
    monthlySaved,
    cancelledCount: cancelled.length,
    currency,
    categoryBreakdown,
  };
}

/* ------------------------------------------------------------------ */
/*  Export / Import                                                    */
/* ------------------------------------------------------------------ */

export async function exportData(): Promise<string> {
  const subs = await listSubscriptions();
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), subscriptions: subs },
    null,
    2,
  );
}

export async function importData(json: string): Promise<number> {
  let data: { subscriptions: Subscription[] };
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
      const existing: Subscription | undefined = await tx("readonly", (s) =>
        s.get(sub.id),
      );
      if (!existing) {
        await tx("readwrite", (s) => s.add(sub));
        imported++;
      }
    }
  }
  notify();
  return imported;
}
