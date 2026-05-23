import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, LayoutDashboard, List, X } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { SubscriptionList } from "@/components/SubscriptionList";
import { AddSubscriptionForm } from "@/components/AddSubscriptionForm";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
  addSubscription,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
} from "@/lib/db";
import type { Subscription } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CindR — Burn through subscriptions, not cash." },
      {
        name: "description",
        content:
          "Privacy-first subscription tracker. All data stays in your browser.",
      },
      { name: "theme-color", content: "#0a0a0f" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: CindRApp,
});

type Tab = "dashboard" | "list";

function CindRApp() {
  const { subs, stats } = useSubscriptions();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(s: Subscription) {
    setEditing(s);
    setOpen(true);
  }

  async function handleSubmit(
    data: Omit<Subscription, "id" | "createdAt" | "cancelled">,
    id?: string,
  ) {
    try {
      if (id) await updateSubscription(id, data);
      else await addSubscription(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleCancel(s: Subscription) {
    await cancelSubscription(s.id);
  }
  async function handleDelete(s: Subscription) {
    await deleteSubscription(s.id);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {error && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-destructive/40 bg-destructive/15 px-4 py-2.5 text-sm text-destructive">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="rounded p-1 hover:bg-destructive/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none text-foreground">
                CindR
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Burn through subscriptions
              </div>
            </div>
          </div>
          <nav className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Stats</span>
            </TabButton>
            <TabButton active={tab === "list"} onClick={() => setTab("list")}>
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-5">
        {tab === "dashboard" ? (
          <Dashboard stats={stats} hasAny={subs.length > 0} onAdd={openAdd} />
        ) : (
          <SubscriptionList
            subs={subs}
            onAdd={openAdd}
            onEdit={openEdit}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />
        )}
      </main>

      <AddSubscriptionForm
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
