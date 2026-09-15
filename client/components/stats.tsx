"use client";

import { Card } from "@heroui/react";

import { formatMoney } from "@/lib/api";
import type { Summary } from "@/types";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card variant="secondary">
      <Card.Content className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xl font-semibold tabular-nums tracking-tight">{value}</span>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </Card.Content>
    </Card>
  );
}

export function Stats({ summary }: { summary: Summary | null }) {
  const total = summary?.total_amount ?? 0;
  const prev = summary?.previous_total ?? null;
  const top = summary?.category_breakdown[0];
  const max = summary?.max_expense;

  let cmp: string | undefined;
  if (prev !== null && prev > 0) {
    const pct = Math.round(((total - prev) / prev) * 100);
    cmp = `${pct > 0 ? "+" : ""}${pct}% к прошлому месяцу`;
  } else if (prev === 0 && total > 0) cmp = "в прошлом месяце трат не было";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Всего" sub={cmp} value={formatMoney(total)} />
      <Stat label="В день" sub={`${summary?.total_count ?? 0} записей`} value={formatMoney(summary?.avg_per_day ?? 0)} />
      <Stat label="Главная категория" sub={top ? `${top.percentage}%` : undefined} value={top?.category ?? "—"} />
      <Stat label="Крупнейшая трата" sub={max?.description || max?.category} value={max ? formatMoney(max.amount) : "—"} />
    </div>
  );
}
