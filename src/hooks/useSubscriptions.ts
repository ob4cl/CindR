import { useEffect, useState, useCallback } from "react";
import {
  listSubscriptions,
  subscribe,
  getStats,
} from "@/lib/db";
import type { Subscription, Stats } from "@/types";

export function useSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const refresh = useCallback(async () => {
    const [s, st] = await Promise.all([listSubscriptions(), getStats()]);
    setSubs(s);
    setStats(st);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribe(() => {
      refresh();
    });
    return () => {
      unsub();
    };
  }, [refresh]);

  return { subs, stats, refresh };
}