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
    </div>
  );
}