"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1200,
  decimals,
  className,
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const animate = useCallback(
    (timestamp: number) => {
      if (!mountedRef.current) return;

      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * value);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    },
    [value, duration],
  );

  useEffect(() => {
    mountedRef.current = true;
    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      mountedRef.current = false;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animate]);

  // Format: use explicit decimals if provided, otherwise auto-detect
  const formatted =
    decimals !== undefined
      ? current.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
    : value % 1 !== 0
      ? current.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : Math.round(current).toLocaleString();

  return (
    <span className={cn("counter-enter tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
