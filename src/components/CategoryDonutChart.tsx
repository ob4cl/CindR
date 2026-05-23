"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Category, Currency } from "@/types";
import { CURRENCY_SYMBOLS, CATEGORIES } from "@/types";

// ── Category colors (exact hex values from spec) ───────────────────────────
const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#f97316",
  Software: "#3b82f6",
  Cloud: "#8b5cf6",
  Utilities: "#eab308",
  Finance: "#22c55e",
  Health: "#ef4444",
  Education: "#06b6d4",
  Other: "#6b7280",
};

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  breakdown: Record<Category, number>;
  currency: Currency;
  total: number;
}

// ── Format helpers ─────────────────────────────────────────────────────────
function fmt(n: number, currency: Currency) {
  return `${CURRENCY_SYMBOLS[currency]}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtCompact(n: number, currency: Currency) {
  if (n < 1000) return fmt(n, currency);
  if (n < 1_000_000)
    return `${CURRENCY_SYMBOLS[currency]}${(n / 1000).toFixed(1)}k`;
  return `${CURRENCY_SYMBOLS[currency]}${(n / 1_000_000).toFixed(1)}M`;
}

// ── Custom center label renderer (SVG foreignObject) ───────────────────────
function CenterLabel({ total, currency }: { total: number; currency: Currency }) {
  return (
    <foreignObject
      x="50%"
      y="50%"
      width={120}
      height={60}
      style={{ transform: "translate(-60px, -30px)", pointerEvents: "none" }}
    >
      <div className="flex flex-col items-center justify-center h-full text-center select-none">
        <span className="text-[1.65rem] font-bold leading-tight text-foreground tabular-nums">
          {fmtCompact(total, currency)}
        </span>
        <span className="text-[0.7rem] leading-tight text-muted-foreground">
          /month
        </span>
      </div>
    </foreignObject>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; pct: number } }>;
  currency: Currency;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm text-sm">
      <div className="font-medium text-foreground">{d.name}</div>
      <div className="flex items-center gap-2 mt-0.5 tabular-nums">
        <span className="text-muted-foreground">{fmt(d.value, currency)}</span>
        <span className="text-xs text-muted-foreground/70">
          ({d.pct}%)
        </span>
      </div>
    </div>
  );
}

// ── Legend content (rendered below the chart) ──────────────────────────────
function ChartLegend({
  data,
  currency,
}: {
  data: Array<{ name: string; value: number; color: string; pct: number }>;
  currency: Currency;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3 px-2">
      {data.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-foreground font-medium">{entry.name}</span>
          <span className="tabular-nums">
            {fmtCompact(entry.value, currency)}
          </span>
          <span className="text-muted-foreground/60 tabular-nums">
            {entry.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function CategoryDonutChart({ breakdown, currency, total }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Build data array from breakdown, filter zero amounts, sort desc
  const chartData = CATEGORIES.filter((cat) => breakdown[cat] > 0)
    .map((cat) => ({
      name: cat,
      value: breakdown[cat],
      color: CATEGORY_COLORS[cat],
      pct:
        total > 0 ? Math.round((breakdown[cat] / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // If nothing to show
  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Spending by Category
        </h3>
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
                d="M5.25 7.5a2.25 2.25 0 0 1 2.25-2.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 12v.001"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8.25v.001"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.75v.001"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            No category data yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        Spending by Category
      </h3>

      {/* Donut chart */}
      <div className="relative flex justify-center">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={3}
              cornerRadius={4}
              dataKey="value"
              strokeWidth={0}
              activeIndex={activeIndex ?? undefined}
              activeShape={(props: unknown) => {
                const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
                  props as {
                    cx: number;
                    cy: number;
                    innerRadius: number;
                    outerRadius: number;
                    startAngle: number;
                    endAngle: number;
                    fill: string;
                  };
                return (
                  <g>
                    <path
                      d={`M ${cx + (outerRadius + 4) * Math.cos((-startAngle * Math.PI) / 180)}
                          ${cy + (outerRadius + 4) * Math.sin((-startAngle * Math.PI) / 180)}
                          A ${outerRadius + 4} ${outerRadius + 4} 0
                          ${endAngle - startAngle > 180 ? 1 : 0} 1
                          ${cx + (outerRadius + 4) * Math.cos((-endAngle * Math.PI) / 180)}
                          ${cy + (outerRadius + 4) * Math.sin((-endAngle * Math.PI) / 180)}
                          L ${cx + innerRadius * Math.cos((-endAngle * Math.PI) / 180)}
                          ${cy + innerRadius * Math.sin((-endAngle * Math.PI) / 180)}
                          A ${innerRadius} ${innerRadius} 0
                          ${endAngle - startAngle > 180 ? 1 : 0} 0
                          ${cx + innerRadius * Math.cos((-startAngle * Math.PI) / 180)}
                          ${cy + innerRadius * Math.sin((-startAngle * Math.PI) / 180)}
                          Z`}
                      fill={fill}
                      opacity={0.85}
                    />
                  </g>
                );
              }}
              onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              // Custom label: show nothing inside segments
              label={() => null}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.color}
                  className="outline-none"
                />
              ))}
            </Pie>

            {/* Center label as a separate overlay */}
            <CenterLabel total={total} currency={currency} />

            <Tooltip content={<CustomTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <ChartLegend data={chartData} currency={currency} />
    </div>
  );
}
