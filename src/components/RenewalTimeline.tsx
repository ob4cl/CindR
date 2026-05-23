"use client";

import { useRef } from "react";
import type { UpcomingRenewal, Currency } from "@/types";
import { CURRENCY_SYMBOLS } from "@/types";
import { cn } from "@/lib/utils";

interface RenewalTimelineProps {
  renewals: UpcomingRenewal[];
  className?: string;
}

function fmtAmount(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getUrgency(daysUntil: number): "urgent" | "medium" | "far" {
  if (daysUntil <= 7) return "urgent";
  if (daysUntil <= 30) return "medium";
  return "far";
}

function DotBadge({
  urgency,
}: {
  urgency: "urgent" | "medium" | "far";
}) {
  const colorClass =
    urgency === "urgent"
      ? "bg-destructive timeline-dot"
      : urgency === "medium"
        ? "bg-savings"
        : "bg-muted-foreground/50";

  return (
    <div className="relative flex items-center justify-center">
      <span
        className={cn(
          "block w-3 h-3 rounded-full",
          colorClass,
        )}
      />
    </div>
  );
}

export function RenewalTimeline({ renewals, className }: RenewalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayItems = renewals.slice(0, 5);

  if (displayItems.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground text-center py-4", className)}>
        No upcoming renewals
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-x-auto",
          renewals.length > 5 && "pb-2",
        )}
      >
        <div className="flex items-start min-w-fit gap-0 px-2">
          {displayItems.map((item, index) => {
            const urgency = getUrgency(item.daysUntil);

            return (
              <div
                key={item.subscriptionId}
                className="flex flex-col items-center relative"
                style={{ width: displayItems.length <= 3 ? "33.33%" : "20%" }}
              >
                {/* Connector line segment */}
                {index < displayItems.length - 1 && (
                  <div className="absolute top-[6px] left-[50%] w-full h-[1px] bg-border" />
                )}

                {/* Dot */}
                <div className="relative z-10 bg-background px-1">
                  <DotBadge urgency={urgency} />
                </div>

                {/* Label */}
                <div className="mt-2 text-center px-1">
                  <p className="text-xs font-medium text-foreground truncate max-w-[100px]">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtAmount(item.amount, item.currency)}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] mt-0.5",
                      urgency === "urgent"
                        ? "text-destructive font-medium"
                        : urgency === "medium"
                          ? "text-savings"
                          : "text-muted-foreground",
                    )}
                  >
                    {item.daysUntil === 0
                      ? "Today"
                      : item.daysUntil === 1
                        ? "Tomorrow"
                        : `${item.daysUntil}d`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicator if more items are available */}
      {renewals.length > 5 && (
        <p className="text-[11px] text-muted-foreground text-center mt-1">
          +{renewals.length - 5} more renewals
        </p>
      )}
    </div>
  );
}
