import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description?: string | null;
}

export interface CategorySummary {
  category: string;
  total_amount: number;
  count: number;
  percentage: number;
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
}

export interface Category {
  name: string;
  key: string;
}
