import { useMemo, useState } from "react";
import type { Subscription } from "@/types";
import { Search, Plus } from "lucide-react";
import { SubscriptionCard } from "./SubscriptionCard";

type Filter = "active" | "cancelled" | "all";

interface Props {
  subs: Subscription[];
  onAdd: () => void;
  onEdit: (s: Subscription) => void;
  onCancel: (s: Subscription) => void;
  onDelete: (s: Subscription) => void;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

export function SubscriptionList({
  subs,
  onAdd,
  onEdit,
  onCancel,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subs.filter((s) => {
      if (filter === "active" && s.cancelled) return false;
      if (filter === "cancelled" && !s.cancelled) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [subs, filter, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={onAdd}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`h-9 rounded-full border px-4 text-xs font-medium transition-colors ${
              filter === f.id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 py-12 text-center text-sm text-muted-foreground">
          {subs.length === 0
            ? "No subscriptions yet. Tap Add to create one."
            : "Nothing matches that filter."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((s, i) => (
            <div
              key={s.id}
              className="stagger-item card-glow rounded-xl"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <SubscriptionCard
                sub={s}
                onEdit={onEdit}
                onCancel={onCancel}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}