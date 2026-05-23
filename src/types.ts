export type BillingCycle = "monthly" | "yearly" | "quarterly" | "weekly" | "custom";
export type Currency = "GBP" | "USD" | "EUR" | "AUD" | "CAD";
export type Category =
  | "Entertainment"
  | "Software"
  | "Cloud"
  | "Utilities"
  | "Finance"
  | "Health"
  | "Education"
  | "Other";

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  customDays?: number;
  category: Category;
  nextRenewal: string; // ISO date
  notes?: string;
  cancelled: boolean;
  cancelledAt?: string;
  createdAt: string;
}

export interface Stats {
  monthly: number;
  yearly: number;
  active: number;
  renewalsNext30: number;
  monthlySaved: number;
  cancelledCount: number;
  currency: Currency;
  categoryBreakdown: Record<Category, number>;
}

export const CURRENCIES: Currency[] = ["GBP", "USD", "EUR", "AUD", "CAD"];
export const CATEGORIES: Category[] = [
  "Entertainment",
  "Software",
  "Cloud",
  "Utilities",
  "Finance",
  "Health",
  "Education",
  "Other",
];
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
};
export const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "/mo",
  yearly: "/yr",
  quarterly: "/qtr",
  weekly: "/wk",
  custom: "/cycle",
};