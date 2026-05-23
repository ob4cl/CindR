import { useState, useEffect } from "react";
import type { Subscription } from "@/types";
import { CURRENCY_SYMBOLS, CYCLE_LABELS } from "@/types";
import { Calendar, Edit3, Ban, Trash2, Star } from "lucide-react";
import { getPaymentTotal } from "@/lib/db";

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
  const [paymentTotal, setPaymentTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPaymentTotal(sub.id).then((total) => {
      if (!cancelled) setPaymentTotal(total);
    });
    return () => {
      cancelled = true;
    };
  }, [sub.id]);

  const isOverdue =
    !sub.cancelled && +new Date(sub.nextRenewal) < Date.now();
  const amountStr = `${CURRENCY_SYMBOLS[sub.currency]}${sub.amount.toFixed(2)}`;

  // Price change indicator
  const previousAmounts = sub.previousAmounts ?? [];
  const hasPriceChanges = previousAmounts.length > 0;
  const lastPreviousAmount = hasPriceChanges
    ? previousAmounts[previousAmounts.length - 1]
    : null;
  const priceDiff =
    lastPreviousAmount && lastPreviousAmount.amount !== sub.amount
      ? sub.amount - lastPreviousAmount.amount
      : null;

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
              <div className="text-xs text-muted-foreground">
                {sub.category}
              </div>

              {/* Worth Score stars */}
              {sub.worthScore !== undefined && (
                <div className="mt-1 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-[14px] w-[14px]"
                      fill={
                        star <= sub.worthScore!
                          ? "#8b5cf6"
                          : "none"
                      }
                      strokeWidth={1.5}
                      style={{
                        color:
                          star <= sub.worthScore!
                            ? "#8b5cf6"
                            : "var(--color-muted-foreground)",
                      }}
                    />
                  ))}
                </div>
              )}
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

              {/* Price change indicator */}
              {!sub.cancelled && priceDiff !== null && (
                <div
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    priceDiff < 0
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {priceDiff < 0 ? "↓" : "↑"}{" "}
                  {CURRENCY_SYMBOLS[sub.currency]}
                  {Math.abs(priceDiff).toFixed(2)}
                </div>
              )}
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

          {/* Payment total */}
          {!sub.cancelled && paymentTotal !== null && paymentTotal > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Paid {CURRENCY_SYMBOLS[sub.currency]}
              {paymentTotal.toFixed(2)} total
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
          {sub.cancelled && paymentTotal !== null && paymentTotal > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Paid {CURRENCY_SYMBOLS[sub.currency]}
              {paymentTotal.toFixed(2)} total
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
