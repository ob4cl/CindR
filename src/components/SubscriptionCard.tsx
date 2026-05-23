import type { Subscription } from "@/types";
import { CURRENCY_SYMBOLS, CYCLE_LABELS } from "@/types";
import { Calendar, Edit3, Ban, Trash2 } from "lucide-react";

interface Props {
  sub: Subscription;
  onEdit: (s: Subscription) => void;
  onCancel: (s: Subscription) => void;
  onDelete: (s: Subscription) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionCard({ sub, onEdit, onCancel, onDelete }: Props) {
  const isOverdue =
    !sub.cancelled && +new Date(sub.nextRenewal) < Date.now();
  const amountStr = `${CURRENCY_SYMBOLS[sub.currency]}${sub.amount.toFixed(2)}`;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary font-semibold">
          {sub.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">
                {sub.name}
              </div>
              <div className="text-xs text-muted-foreground">{sub.category}</div>
            </div>
            <div className="text-right">
              <div
                className={`font-semibold tabular-nums ${
                  sub.cancelled
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {amountStr}
                <span className="text-xs text-muted-foreground">
                  {CYCLE_LABELS[sub.billingCycle]}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {sub.cancelled ? (
              <span className="text-muted-foreground">
                Cancelled{" "}
                {sub.cancelledAt ? formatDate(sub.cancelledAt) : ""}
              </span>
            ) : isOverdue ? (
              <span className="font-medium text-destructive">Overdue</span>
            ) : (
              <span className="text-muted-foreground">
                Renews {formatDate(sub.nextRenewal)}
              </span>
            )}
          </div>

          {!sub.cancelled && (
            <div className="mt-3 flex gap-1">
              <button
                onClick={() => onEdit(sub)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => onCancel(sub)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:border-savings/60 hover:text-savings"
              >
                <Ban className="h-3.5 w-3.5" /> Cancel
              </button>
              <button
                onClick={() => onDelete(sub)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
          {sub.cancelled && (
            <div className="mt-3 flex gap-1">
              <button
                onClick={() => onDelete(sub)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}