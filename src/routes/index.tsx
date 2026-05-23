import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  List,
  BarChart3,
  X,
  Download,
  Upload,
} from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { SubscriptionList } from "@/components/SubscriptionList";
import { AddSubscriptionForm } from "@/components/AddSubscriptionForm";
import { Analytics } from "@/components/Analytics";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
  addSubscription,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
  logPayment,
  listPayments,
  exportData,
  importData,
  getBudget,
  saveBudget,
} from "@/lib/db";
import type { Subscription, PaymentRecord, BudgetSettings, Currency } from "@/types";
import { CURRENCY_SYMBOLS } from "@/types";
import { toast } from "sonner";
import { Confetti } from "@/components/Confetti";

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
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: CindRApp,
});

type Tab = "dashboard" | "analytics" | "list";

function CindRApp() {
  const { subs, stats } = useSubscriptions();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [tabKey, setTabKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      toast.success("Installed! CindR is now on your home screen.");
    }
    setShowInstall(false);
    setInstallPrompt(null);
  }

  // Fetch payments
  const refreshPayments = useCallback(async () => {
    const p = await listPayments();
    setPayments(p);
  }, []);

  useEffect(() => {
    refreshPayments();
  }, [refreshPayments, subs]);

  function switchTab(t: Tab) {
    if (t !== tab) {
      setTab(t);
      setTabKey((k) => k + 1);
    }
  }

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
      setOpen(false);
      toast.success(id ? "Subscription updated" : "Subscription added");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleCancel(s: Subscription) {
    await cancelSubscription(s.id);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    toast.success(`🎉 Cancelled ${s.name} — saving ${CURRENCY_SYMBOLS[s.currency]}${s.amount.toFixed(2)}/mo!`, {
      description: "That's money back in your pocket.",
    });
  }
  async function handleDelete(s: Subscription) {
    await deleteSubscription(s.id);
    toast("Subscription deleted", {
      description: `${s.name} has been removed.`,
    });
  }

  // Log a payment (mark as paid today)
  async function handleLogPayment(s: Subscription) {
    try {
      await logPayment(s.id, s.amount, s.currency, s.billingCycle);
      await refreshPayments();
      toast.success(`Payment logged for ${s.name}`);
    } catch (e) {
      toast.error("Failed to log payment");
    }
  }

  // Export
  async function handleExport() {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cindr-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Export failed");
    }
  }

  // Import
  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const count = await importData(text);
        toast.success(`Imported ${count} subscription${count === 1 ? "" : "s"}`);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Import failed — invalid file",
        );
      }
    };
    input.click();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Error banner */}
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

      {/* PWA install banner */}
      {showInstall && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-primary/40 bg-primary/10 px-4 py-2.5 text-sm">
          <span className="text-primary">
            Install CindR to your home screen for quick access
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="rounded p-1 hover:bg-primary/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 text-lg">
              🔥
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

          <div className="flex items-center gap-2">
            <nav className="flex gap-1 rounded-lg border border-border bg-surface p-1">
              <TabButton
                active={tab === "dashboard"}
                onClick={() => switchTab("dashboard")}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabButton>
              <TabButton
                active={tab === "analytics"}
                onClick={() => switchTab("analytics")}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabButton>
              <TabButton
                active={tab === "list"}
                onClick={() => switchTab("list")}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </TabButton>
            </nav>

            {/* Export/Import menu */}
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-muted-foreground transition-all hover:text-foreground hover:border-primary/40 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Backup</span>
              </button>
              {showExport && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExport(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-surface p-1 shadow-xl">
                    <button
                      onClick={() => {
                        handleExport();
                        setShowExport(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-foreground transition-colors hover:bg-background"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export backup
                    </button>
                    <button
                      onClick={() => {
                        handleImport();
                        setShowExport(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-foreground transition-colors hover:bg-background"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Import backup
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">
        <div key={tabKey} className="tab-panel">
          {tab === "dashboard" ? (
            <Dashboard stats={stats} hasAny={subs.length > 0} onAdd={openAdd} onImport={handleImport} />
          ) : tab === "analytics" ? (
            <Analytics stats={stats} payments={payments} />
          ) : (
            <SubscriptionList
              subs={subs}
              onAdd={openAdd}
              onEdit={openEdit}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>

      <Confetti active={showConfetti} />

      {/* Add/Edit modal */}
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
      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
