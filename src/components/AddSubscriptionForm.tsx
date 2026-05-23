import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type {
  BillingCycle,
  Category,
  Currency,
  Subscription,
} from "@/types";
import { CATEGORIES, CURRENCIES } from "@/types";

interface Props {
  open: boolean;
  editing?: Subscription | null;
  onClose: () => void;
  onSubmit: (
    data: Omit<Subscription, "id" | "createdAt" | "cancelled">,
    id?: string,
  ) => Promise<void> | void;
}

interface FormState {
  name: string;
  amount: string;
  currency: Currency;
  billingCycle: BillingCycle;
  customDays: string;
  category: Category;
  nextRenewal: string;
  notes: string;
}

const empty: FormState = {
  name: "",
  amount: "",
  currency: "GBP",
  billingCycle: "monthly",
  customDays: "30",
  category: "Entertainment",
  nextRenewal: new Date().toISOString().slice(0, 10),
  notes: "",
};

const inputBase =
  "h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none";

export function AddSubscriptionForm({ open, editing, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        amount: String(editing.amount),
        currency: editing.currency,
        billingCycle: editing.billingCycle,
        customDays: String(editing.customDays ?? 30),
        category: editing.category,
        nextRenewal: editing.nextRenewal.slice(0, 10),
        notes: editing.notes ?? "",
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [open, editing]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    const amt = Number(form.amount);
    if (!form.amount || isNaN(amt) || amt < 0.01) e.amount = "Enter an amount ≥ 0.01";
    if (form.billingCycle === "custom") {
      const d = Number(form.customDays);
      if (!d || d < 1) e.customDays = "Days must be ≥ 1";
    }
    if (!form.nextRenewal) e.nextRenewal = "Pick a date";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(
        {
          name: form.name.trim(),
          amount: Number(form.amount),
          currency: form.currency,
          billingCycle: form.billingCycle,
          customDays:
            form.billingCycle === "custom" ? Number(form.customDays) : undefined,
          category: form.category,
          nextRenewal: new Date(form.nextRenewal).toISOString(),
          notes: form.notes.trim() || undefined,
        },
        editing?.id,
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function fieldClass(field: keyof FormState) {
    return `${inputBase} ${
      errors[field] ? "border-destructive" : "border-border focus:border-primary"
    }`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {editing ? "Edit subscription" : "Add subscription"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] space-y-4 overflow-y-auto px-5 py-5"
        >
          <Field label="Name" error={errors.name}>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Netflix, Spotify, AWS..."
              className={fieldClass("name")}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Amount" error={errors.amount}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="9.99"
                  className={fieldClass("amount")}
                />
              </Field>
            </div>
            <Field label="Currency">
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value as Currency)}
                className={`${inputBase} border-border focus:border-primary`}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Billing cycle">
            <select
              value={form.billingCycle}
              onChange={(e) => set("billingCycle", e.target.value as BillingCycle)}
              className={`${inputBase} border-border focus:border-primary`}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </Field>

          {form.billingCycle === "custom" && (
            <Field label="Days per cycle" error={errors.customDays}>
              <input
                type="number"
                min="1"
                value={form.customDays}
                onChange={(e) => set("customDays", e.target.value)}
                className={fieldClass("customDays")}
              />
            </Field>
          )}

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value as Category)}
              className={`${inputBase} border-border focus:border-primary`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Next renewal" error={errors.nextRenewal}>
            <input
              type="date"
              value={form.nextRenewal}
              onChange={(e) => set("nextRenewal", e.target.value)}
              className={fieldClass("nextRenewal")}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Login email, account details..."
              rows={3}
              className={`${inputBase} h-auto resize-none py-2.5 border-border focus:border-primary`}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {editing ? "Save changes" : "Add subscription"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}