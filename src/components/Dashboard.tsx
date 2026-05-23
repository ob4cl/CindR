import type { Stats } from "@/types";
import { CURRENCY_SYMBOLS } from "@/types";
import {
  CalendarClock,
  Layers,
  TrendingDown,
  Wallet,
  PiggyBank,
  Star,
  History,
  CheckCircle,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { AnimatedCounter } from "./ui/animated-counter";
import { RenewalTimeline } from "./RenewalTimeline";
import { BudgetGauge } from "./BudgetGauge";

interface Props {
  stats: Stats | null;
  hasAny: boolean;
  onAdd: () => void;
  onImport: () => void;
}

function fmt(n: number, currency: keyof typeof CURRENCY_SYMBOLS) {
  return `${CURRENCY_SYMBOLS[currency]}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function Dashboard({ stats, hasAny, onAdd, onImport }: Props) {
  if (!hasAny || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 border border-border text-4xl">
          🔥
        </div>
        <h2 className="mt-6 text-xl font-bold text-foreground">
          No subscriptions yet
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Track your SaaS, streaming, cloud — all in one place.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={onAdd}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-6 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add your first subscription
          </button>
          <span className="text-xs text-muted-foreground">
            Got a backup?{" "}
            <button
              onClick={onImport}
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Restore from file
            </button>
          </span>
        </div>
      </div>
    );
  }

  const cur = stats.currency;
  const dueIn7 = stats.upcomingRenewals.filter((r) => r.daysUntil <= 7).length;

  return (
    <div className="space-y-4">
      {/* ── Section 1: Stat Cards (2x2 grid) ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Monthly"
          icon={<TrendingDown className="h-4 w-4" />}
          colorScheme="rose"
          accent
        >
          <AnimatedCounter
            value={stats.monthly}
            prefix={CURRENCY_SYMBOLS[cur]}
            suffix="/mo"
          />
        </StatCard>
        <StatCard
          label="Yearly"
          icon={<Wallet className="h-4 w-4" />}
          colorScheme="blue"
        >
          <AnimatedCounter
            value={stats.yearly}
            prefix={CURRENCY_SYMBOLS[cur]}
            suffix="/yr"
          />
        </StatCard>
        <StatCard
          label="Active"
          icon={<Layers className="h-4 w-4" />}
          colorScheme="green"
        >
          <AnimatedCounter value={stats.active} />
        </StatCard>
        <StatCard
          label="Due in 7 days"
          icon={<CalendarClock className="h-4 w-4" />}
          colorScheme="amber"
          accent={dueIn7 > 0}
        >
          <AnimatedCounter value={dueIn7} />
        </StatCard>
      </div>

      {/* ── Section 2: Budget Gauge ── */}
      {stats.budget && stats.budgetUsage !== undefined && (
        <div className="rounded-xl border border-border bg-surface/70 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Monthly Budget
            </span>
          </div>
          <div className="flex items-center justify-center">
            <BudgetGauge
              budget={stats.budget}
              budgetUsage={stats.budgetUsage}
              monthly={stats.monthly}
              currency={stats.currency}
            />
          </div>
          {stats.budgetUsage > 0.9 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Over budget by{" "}
              {fmt(Math.abs(stats.monthly - stats.budget.monthlyLimit), cur)}
            </div>
          )}
          {stats.budgetUsage > 0.85 && stats.budgetUsage <= 0.9 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              Close to budget limit
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: Savings Banner ── */}
      {stats.monthlySaved > 0 && (
        <div className="savings-gradient rounded-xl p-5">
          <div className="flex items-center gap-2 text-success">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              You're saving
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-success">
              {fmt(stats.monthlySaved, cur)}
            </span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            From {stats.cancelledCount} cancelled subscription
            {stats.cancelledCount === 1 ? "" : "s"}.
          </p>
        </div>
      )}

      {/* ── Section 4: Upcoming Renewals ── */}
      <div className="rounded-xl border border-border bg-surface/70 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Upcoming Renewals
          </h3>
        </div>
        {stats.upcomingRenewals.length > 0 ? (
          <RenewalTimeline renewals={stats.upcomingRenewals} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <CheckCircle className="h-4 w-4 text-success" />
            No renewals in the next 90 days
          </div>
        )}
      </div>

      {/* ── Section 5: Worth Score ── */}
      {stats.avgWorthScore !== undefined && (
        <div className="rounded-xl border border-border bg-surface/70 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Average Worth Score
            </h3>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-foreground">
              ⭐ {stats.avgWorthScore.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on {stats.active} rated subscription
            {stats.active === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {/* ── Section 6: Lifetime Spend ── */}
      {stats.paymentTotal !== undefined && stats.paymentTotal > 0 && (
        <div className="rounded-xl border border-border bg-surface/70 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lifetime Spend
            </h3>
          </div>
          <div className="text-2xl font-semibold text-foreground tabular-nums">
            <AnimatedCounter
              value={stats.paymentTotal}
              prefix={CURRENCY_SYMBOLS[cur]}
            />
          </div>
        </div>
      )}

      {/* ── Category Breakdown ── */}
      <CategoryBreakdown stats={stats} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  icon,
  accent,
  colorScheme,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  accent?: boolean;
  colorScheme?: "purple" | "blue" | "green" | "amber" | "rose";
  children: React.ReactNode;
}) {
  const schemes = {
    purple: "border-l-purple-500/50 bg-purple-500/5 hover:border-purple-500/30",
    blue: "border-l-blue-500/50 bg-blue-500/5 hover:border-blue-500/30",
    green: "border-l-green-500/50 bg-green-500/5 hover:border-green-500/30",
    amber: "border-l-amber-500/50 bg-amber-500/5 hover:border-amber-500/30",
    rose: "border-l-rose-500/50 bg-rose-500/5 hover:border-rose-500/30",
  };
  const iconColors = {
    purple: "text-purple-400",
    blue: "text-blue-400",
    green: "text-green-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  const scheme = colorScheme || "purple";
  return (
    <div
      className={`rounded-xl border border-l-4 bg-surface/80 backdrop-blur-sm p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        schemes[scheme]
      } ${accent ? "border-primary/40" : "border-border"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={iconColors[scheme]}>{icon}</span>
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CategoryBreakdown                                                  */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: "#f97316",
  Software: "#3b82f6",
  Cloud: "#8b5cf6",
  Utilities: "#eab308",
  Finance: "#22c55e",
  Health: "#ef4444",
  Education: "#06b6d4",
  Other: "#6b7280",
};

function CategoryBreakdown({ stats }: { stats: Stats }) {
  const entries = Object.entries(stats.categoryBreakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return null;

  const max = entries[0][1];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        By category
      </h3>
      <div className="space-y-2.5">
        {entries.map(([cat, amount]) => {
          const pct = Math.round((amount / stats.monthly) * 100);
          const width = Math.max((amount / max) * 100, 4);
          return (
            <div key={cat} className="flex items-center gap-2.5 text-sm">
              <span className="w-20 truncate text-foreground">{cat}</span>
              <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${width}%`,
                    backgroundColor: CATEGORY_COLORS[cat] || "#6b7280",
                  }}
                />
              </div>
              <span className="w-20 text-right tabular-nums text-muted-foreground">
                {fmt(amount, stats.currency)}
                <span className="ml-1 text-xs opacity-60">{pct}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
