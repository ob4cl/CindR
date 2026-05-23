import type { Stats } from "@/types";
import { CURRENCY_SYMBOLS } from "@/types";
import { CalendarClock, Layers, TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface Props {
  stats: Stats | null;
  hasAny: boolean;
  onAdd: () => void;
}

function fmt(n: number, currency: keyof typeof CURRENCY_SYMBOLS) {
  return `${CURRENCY_SYMBOLS[currency]}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-surface p-4 transition-colors hover:border-primary/40 ${
        accent ? "border-primary/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        <span className={accent ? "text-primary" : ""}>{icon}</span>
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function Dashboard({ stats, hasAny, onAdd }: Props) {
  if (!hasAny || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface border border-border">
          <Wallet className="h-9 w-9 text-primary" />
        </div>
        <h2 className="mt-6 text-lg font-semibold text-foreground">
          No subscriptions yet
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Add your first subscription to start tracking.
        </p>
        <button
          onClick={onAdd}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Add subscription
        </button>
      </div>
    );
  }

  const cur = stats.currency;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Monthly"
          value={fmt(stats.monthly, cur)}
          icon={<TrendingDown className="h-4 w-4" />}
          accent
        />
        <StatCard
          label="Yearly"
          value={fmt(stats.yearly, cur)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Active"
          value={String(stats.active)}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Next 30 days"
          value={String(stats.renewalsNext30)}
          icon={<CalendarClock className="h-4 w-4" />}
        />
      </div>

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

      <CategoryBreakdown stats={stats} />
    </div>
  );
}

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
