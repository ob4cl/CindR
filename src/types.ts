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
  worthScore?: number; // 1-5, how much you value this sub
  worthUpdatedAt?: string;
  previousAmounts?: PriceChange[]; // track price history
}

export interface PriceChange {
  amount: number;
  date: string;
  cycle: BillingCycle;
}

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: Currency;
  date: string; // ISO — when the payment happened
  billingCycle: BillingCycle;
  notes?: string;
}

export interface WorthScore {
  subscriptionId: string;
  rating: number; // 1-5
  updatedAt: string;
}

export interface BudgetSettings {
  monthlyLimit: number;
  currency: Currency;
  categoryLimits?: Partial<Record<Category, number>>;
  alertThreshold: number; // 0-1, default 0.85 = warn at 85%
}

export interface SpendingTrend {
  month: string; // "2025-05"
  total: number;
  count: number;
  byCategory: Partial<Record<Category, number>>;
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
  budget?: BudgetSettings;
  budgetUsage?: number; // percentage 0-1
  avgWorthScore?: number;
  paymentTotal?: number; // lifetime total paid
  upcomingRenewals: UpcomingRenewal[];
}

export interface UpcomingRenewal {
  subscriptionId: string;
  name: string;
  amount: number;
  currency: Currency;
  date: string;
  daysUntil: number;
  category: Category;
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
