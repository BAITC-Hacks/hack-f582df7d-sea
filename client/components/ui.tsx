import clsx from "clsx";
import type { ReactNode } from "react";

export const Card = ({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) => (
  <section
    className={clsx(
      "rounded-3xl border border-separator/60 bg-surface/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:p-6",
      className,
    )}
  >
    {(title || action) && (
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {title && <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>}
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const inputCls =
  "w-full rounded-xl border border-separator bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-50";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}) => (
  <button
    className={clsx(
      "inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
      size === "sm" && "px-3 py-1.5 text-xs",
      size === "md" && "px-4 py-2.5 text-sm",
      size === "lg" && "px-5 py-3 text-base",
      variant === "primary" && "bg-accent text-white shadow-[0_4px_14px_-4px_var(--color-accent)] hover:brightness-110",
      variant === "secondary" && "border border-separator bg-surface hover:bg-background",
      variant === "danger" && "bg-danger/10 text-danger hover:bg-danger/20",
      variant === "ghost" && "text-muted hover:bg-surface hover:text-foreground",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export const Chip = ({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) => (
  <button
    className={clsx(
      "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition",
      active ? "bg-accent text-white" : "bg-background text-muted hover:text-foreground",
    )}
    type="button"
    onClick={onClick}
  >
    {children}
  </button>
);

export const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  Еда: { color: "#f97316", icon: "🍔" },
  Транспорт: { color: "#3b82f6", icon: "🚌" },
  Жилье: { color: "#8b5cf6", icon: "🏠" },
  Развлечения: { color: "#ec4899", icon: "🎮" },
  Образование: { color: "#10b981", icon: "📚" },
  Здоровье: { color: "#ef4444", icon: "💊" },
  Одежда: { color: "#eab308", icon: "👕" },
  Другое: { color: "#6b7280", icon: "📦" },
};

export const colorOf = (cat: string) => CATEGORY_META[cat]?.color ?? "#6b7280";
export const iconOf = (cat: string) => CATEGORY_META[cat]?.icon ?? "📦";
