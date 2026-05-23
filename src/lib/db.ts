import type { Subscription, Stats, Currency } from "@/types";

/**
 * Placeholder data layer for CindR.
 *
 * In the real app this is backed by IndexedDB. For now an in-memory
 * Map keeps the UI shell functional. Swap this module for the real
 * IndexedDB-backed implementation without changing the call sites.
 */

const store = new Map<string, Subscription>();
let listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function listSubscriptions(): Promise<Subscription[]> {
  return Array.from(store.values()).sort(
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
  store.set(sub.id, sub);
  notify();
  return sub;
}

export async function updateSubscription(
  id: string,
  patch: Partial<Subscription>,
): Promise<void> {
  const existing = store.get(id);
  if (!existing) return;
  store.set(id, { ...existing, ...patch });
  notify();
}

export async function cancelSubscription(id: string): Promise<void> {
  await updateSubscription(id, {
    cancelled: true,
    cancelledAt: new Date().toISOString(),
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  store.delete(id);
  notify();
}

function monthlyEquivalent(s: Subscription): number {
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
  const subs = Array.from(store.values());
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
  return {
    monthly,
    yearly: monthly * 12,
    active: active.length,
    renewalsNext30,
    monthlySaved,
    cancelledCount: cancelled.length,
    currency,
  };
}