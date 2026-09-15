export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  description?: string | null;
  recipient?: string | null;
}

export type ExpenseInput = Omit<Expense, "id">;

export interface CategorySummary {
  category: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface RecipientSummary {
  recipient: string;
  total_amount: number;
  count: number;
}

export interface MonthBreakdown {
  month: number;
  month_name: string;
  total_amount: number;
  count: number;
}

export interface Summary {
  year: number;
  month: number | null;
  total_amount: number;
  total_count: number;
  category_breakdown: CategorySummary[];
  monthly_breakdown: MonthBreakdown[] | null;
  items: Expense[];
  recipient_breakdown: RecipientSummary[];
  previous_total: number | null;
  avg_per_day: number;
  max_expense: Expense | null;
}

export interface Category {
  name: string;
  key: string;
}

export interface Budget {
  category: string;
  amount: number;
}

export const TOTAL_BUDGET = "__total__";
