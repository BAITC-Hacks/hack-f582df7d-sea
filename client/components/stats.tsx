"use client";

import { formatMoney } from "@/lib/api";
import { iconOf } from "@/components/ui";
import type { Summary } from "@/types";

function Tile({ label, value, sub, tone = "default", icon }: { label: string; value: string; sub?: React.ReactNode; tone?: "accent" | "default"; icon: string }) {
  return (
    <div
      className={
        tone === "accent"
          ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent/70 p-5 text-white shadow-[0_12px_32px_-12px_var(--color-accent)]"
          : "rounded-3xl border border-separator/60 bg-surface/80 p-5"
      }
    >
      <div className="flex items-center justify-between">
        <p className={tone === "accent" ? "text-xs font-medium uppercase tracking-wide text-white/80" : "text-xs font-medium uppercase tracking-wide text-muted"}>{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      {sub && <p className={tone === "accent" ? "mt-1 text-xs text-white/85" : "mt-1 text-xs text-muted"}>{sub}</p>}
    </div>
  );
}

export function Stats({ summary }: { summary: Summary | null }) {
  const total = summary?.total_amount ?? 0;
  const prev = summary?.previous_total ?? null;
  const diff = prev !== null ? total - prev : null;
  const pct = prev && prev > 0 && diff !== null ? Math.round((diff / prev) * 100) : null;
  const top = summary?.category_breakdown[0];
  const max = summary?.max_expense;

  let cmp: React.ReactNode = "нет данных за прошлый месяц";
  if (prev !== null && diff !== null) {
    if (prev === 0 && total === 0) cmp = "как и в прошлом месяце";
    else if (prev === 0) cmp = "в прошлом месяце трат не было";
    else cmp = (
      <>
        <span className="font-semibold">{diff > 0 ? "▲" : diff < 0 ? "▼" : "•"} {pct !== null ? `${Math.abs(pct)}%` : ""}</span>{" "}
        {diff > 0 ? "больше" : diff < 0 ? "меньше" : "столько же"}, чем в прошлом месяце ({formatMoney(prev)})
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tile icon="💰" label="Всего за месяц" sub={cmp} tone="accent" value={formatMoney(total)} />
      <Tile icon="📅" label="В среднем в день" sub={`${summary?.total_count ?? 0} ${plural(summary?.total_count ?? 0)}`} value={formatMoney(summary?.avg_per_day ?? 0)} />
      <Tile
        icon={top ? iconOf(top.category) : "🏷️"}
        label="Главная категория"
        sub={top ? `${top.percentage}% всех трат` : "добавьте первый расход"}
        value={top ? top.category : "—"}
      />
      <Tile
        icon="🔥"
        label="Самая крупная трата"
        sub={max ? `${max.category}${max.description ? " · " + max.description : ""}` : "пока нет"}
        value={max ? formatMoney(max.amount) : "—"}
      />
    </div>
  );
}

function plural(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "запись";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "записи";
  return "записей";
}
