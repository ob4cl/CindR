"use client";

import { useState, useEffect, useRef } from "react";
import { CURRENCY_SYMBOLS, type Currency, type BudgetSettings } from "@/types";
import { cn } from "@/lib/utils";

interface BudgetGaugeProps {
  budget: BudgetSettings;
  budgetUsage: number;
  monthly: number;
  currency: Currency;
  className?: string;
}

const SIZE = 160;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

export function BudgetGauge({
  budget,
  budgetUsage,
  monthly,
  currency,
  className,
}: BudgetGaugeProps) {
  const [offset, setOffset] = useState(CIRCUMFERENCE);
  const animatingRef = useRef(false);

  const used = monthly;
  const limit = budget.monthlyLimit;
  const percentage = budgetUsage;

  // Determine color based on usage
  const getColor = (): string => {
    if (percentage > 0.9) return "var(--destructive)";
    if (percentage >= 0.7) return "var(--savings)";
    return "var(--success)";
  };

  const strokeColor = getColor();

  useEffect(() => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const targetOffset = CIRCUMFERENCE * (1 - percentage);

    // Use requestAnimationFrame for smooth transition
    const startOffset = offset;
    const startTime = performance.now();
    const duration = 1000;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentOffset = startOffset + (targetOffset - startOffset) * eased;
      setOffset(currentOffset);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animatingRef.current = false;
      }
    };

    requestAnimationFrame(animate);
  }, [percentage]); // eslint-disable-line react-hooks/exhaustive-deps

  const symbol = CURRENCY_SYMBOLS[currency];
  const formattedUsed = used.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedLimit = limit.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE_WIDTH}
        />
        {/* Progress ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="budget-ring"
        />
      </svg>
      {/* Center text — rotated back to normal */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">
          {symbol}
          {formattedUsed}
        </span>
        <span className="text-xs text-muted-foreground">
          / {symbol}
          {formattedLimit}
        </span>
      </div>
    </div>
  );
}
