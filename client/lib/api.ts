import type { Category, Expense, ExpenseInput, Summary } from "@/types";

// В браузере ходим на относительный /api (Next проксирует на FastAPI, см. next.config.mjs).
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function extractDetail(body: unknown): string {
  if (!body || typeof body !== "object") return "Неизвестная ошибка сервера";
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const loc = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
        const msg = String(d.msg ?? "").replace(/^Value error, /, "");
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join("; ");
  }
  return "Неизвестная ошибка сервера";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...init,
    });
  } catch {
    throw new ApiError(0, "Сервер недоступен. Убедитесь, что бэкенд запущен (порт 8001).");
  }
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, extractDetail(body));
  }
  return (await res.json()) as T;
}

export const api = {
  categories: () => request<Category[]>("/api/categories"),
  summary: (year: number, month: number) =>
    request<Summary>(`/api/products/summary?year=${year}&month=${month}`),
  create: (data: ExpenseInput) =>
    request<Expense>("/api/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: ExpenseInput) =>
    request<Expense>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request<{ message: string }>(`/api/products/${id}`, { method: "DELETE" }),
  seed: () => request<{ message: string }>("/api/seed", { method: "POST" }),
  clear: () => request<{ message: string }>("/api/products", { method: "DELETE" }),
  exportUrl: (year: number, month: number) => `${BASE}/api/products/export.csv?year=${year}&month=${month}`,
};

export const formatMoney = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n) + " ₸";

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

export const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
export const MONTHS_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
export const pad = (n: number) => String(n).padStart(2, "0");
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
