"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import type { PaymentRecord, Currency } from "@/types";
import { CURRENCY_SYMBOLS } from "@/types";

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  payments: PaymentRecord[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number, currency: Currency) {
  return `${CURRENCY_SYMBOLS[currency]}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Aggregate payments by month ────────────────────────────────────────────
interface MonthlyTotal {
  monthKey: string; // "2025-05"
  label: string; // "May"
  total: number;
}

function aggregateByMonth(payments: PaymentRecord[]): MonthlyTotal[] {
  if (payments.length === 0) return [];

  // Group by YYYY-MM
  const groups: Record<string, number> = {};
  for (const p of payments) {
    try {
      const d = parseISO(p.date);
      const key = format(startOfMonth(d), "yyyy-MM");
      groups[key] = (groups[key] || 0) + p.amount;
    } catch {
      // skip invalid dates
    }
  }

  // Sort chronologically
  const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

  return sorted.map(([key, total]) => {
    // Parse to get month abbreviation
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return {
      monthKey: key,
      label: format(d, "MMM"),
      total: Math.round(total * 100) / 100,
    };
  });
}

// ── Custom tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: Currency;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm text-sm">
      <div className="text-muted-foreground text-xs mb-0.5">{label}</div>
      <div className="font-semibold text-foreground tabular-nums">
        {fmt(payload[0].value, currency)}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function SpendingTrendsChart({ payments }: Props) {
  const data = aggregateByMonth(payments);

  // Determine currency from first payment, fallback to GBP
  const currency: Currency =
    payments.length > 0 ? payments[0].currency : "GBP";

  // Date range subtitle
  const rangeSubtitle =
    data.length > 0
      ? `${data[0].label} ${data[0].monthKey.slice(0, 4)} – ${data[data.length - 1].label} ${data[data.length - 1].monthKey.slice(0, 4)}`
      : null;

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Spending Trends
        </h3>
        <p className="text-sm text-muted-foreground/70 mb-4">
          Your monthly spending over time
        </p>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border border-border">
            <svg
              className="h-7 w-7 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-[260px]">
            No payment history yet. Log a payment to see trends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Spending Trends
          </h3>
          {rangeSubtitle && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {rangeSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, left: -16, bottom: 0 }}
          >
            {/* Purple gradient definition */}
            <defs>
              <linearGradient id="spendingTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                `${CURRENCY_SYMBOLS[currency]}${v}`
              }
              width={50}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              fill="url(#spendingTrendGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "var(--color-primary)",
                stroke: "var(--color-background)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
