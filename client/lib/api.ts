import type { Budget, Category, Expense, ExpenseInput, Summary } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function detail(body: unknown): string {
  const d = (body as { detail?: unknown } | null)?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => String(x.msg ?? "").replace(/^Value error, /, "")).join("; ");
  return "Ошибка сервера";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, cache: "no-store", ...init });
  } catch {
    throw new ApiError(0, "Сервер недоступен. Запустите бэкенд на порту 8001.");
  }
  if (!res.ok) throw new ApiError(res.status, detail(await res.json().catch(() => null)));
  return res.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  health: () => request<{ status: string; count: number }>("/api/health"),
  categories: () => request<Category[]>("/api/categories"),
  summary: (year: number, month: number) => request<Summary>(`/api/products/summary?year=${year}&month=${month}`),
  list: (params: { year?: number; month?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.year) q.set("year", String(params.year));
    if (params.month) q.set("month", String(params.month));
    return request<Expense[]>(`/api/products${q.size ? `?${q}` : ""}`);
  },
  create: (data: ExpenseInput) => request<Expense>("/api/products", { method: "POST", body: json(data) }),
  update: (id: number, data: ExpenseInput) => request<Expense>(`/api/products/${id}`, { method: "PUT", body: json(data) }),
  remove: (id: number) => request<{ message: string }>(`/api/products/${id}`, { method: "DELETE" }),
  clear: () => request<{ deleted: number }>("/api/products", { method: "DELETE" }),
  seed: (demo = false) => request<{ count: number }>(`/api/seed${demo ? "?demo=true" : ""}`, { method: "POST" }),
  budgets: () => request<Budget[]>("/api/budgets"),
  saveBudgets: (items: Budget[]) => request<Budget[]>("/api/budgets", { method: "PUT", body: json(items) }),
  exportUrl: (year: number, month: number) => `${BASE}/api/products/export.csv?year=${year}&month=${month}`,
};

export const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
export const MONTHS_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const pad = (n: number) => String(n).padStart(2, "0");
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const currentYm = () => todayIso().slice(0, 7);
export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
export const formatNumber = (n: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);
export const compact = (n: number) => new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(n);
export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};
