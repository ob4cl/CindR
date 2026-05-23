"use client";

import type { Stats, PaymentRecord } from "@/types";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { SpendingTrendsChart } from "./SpendingTrendsChart";
import { BarChart3 } from "lucide-react";

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  stats: Stats | null;
  payments: PaymentRecord[];
}

// ── Component ──────────────────────────────────────────────────────────────
export function Analytics({ stats, payments }: Props) {
  // ── Empty state: no stats and no payments ───────────────────────────────
  if (!stats && payments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Analytics
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background border border-border">
            <BarChart3 className="h-9 w-9 text-muted-foreground" />
          </div>
          <h2 className="mt-5 text-base font-semibold text-foreground">
            No analytics data yet
          </h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Add subscriptions and log payments to see spending breakdowns and
            trends.
          </p>
        </div>
      </div>
    );
  }

  // ── Normal: stats available ─────────────────────────────────────────────
  const breakdown = stats?.categoryBreakdown ?? ({} as Record<string, number>);
  const total = stats?.monthly ?? 0;
  const currency = stats?.currency ?? "GBP";

  return (
    <div className="space-y-6">
      <CategoryDonutChart
        breakdown={breakdown}
        currency={currency}
        total={total}
      />
      <SpendingTrendsChart payments={payments} />
    </div>
  );
}
