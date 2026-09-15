import clsx from "clsx";
import type { ReactNode } from "react";

export const Card = ({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) => (
  <section className={clsx("rounded-2xl border border-separator bg-surface p-4 shadow-sm sm:p-5", className)}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const inputCls =
  "w-full rounded-xl border border-separator bg-background px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50";

export const Button = ({
  children,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) => (
  <button
    className={clsx(
      "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary" && "bg-accent text-white hover:opacity-90",
      variant === "secondary" && "border border-separator bg-background hover:bg-surface",
      variant === "danger" && "bg-danger/10 text-danger hover:bg-danger/20",
      variant === "ghost" && "text-muted hover:text-foreground",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export const CATEGORY_COLORS: Record<string, string> = {
  Еда: "#f97316",
  Транспорт: "#3b82f6",
  Жилье: "#8b5cf6",
  Развлечения: "#ec4899",
  Образование: "#10b981",
  Здоровье: "#ef4444",
  Одежда: "#eab308",
  Другое: "#6b7280",
};

export const colorOf = (cat: string) => CATEGORY_COLORS[cat] ?? "#6b7280";
