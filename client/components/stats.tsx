"use client";

import { Card, Skeleton } from "@heroui/react";

import { useApp } from "@/app/providers";
import { plural } from "@/lib/api";
import type { Summary } from "@/types";

function Stat({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <Card variant="secondary">
      <Card.Content className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted">{label}</span>
        {loading ? <Skeleton className="h-7 w-28" /> : <span className="truncate text-xl font-semibold tabular-nums tracking-tight">{value}</span>}
        <span className="min-h-4 truncate text-xs text-muted">{sub}</span>
      </Card.Content>
    </Card>
  );
}

export function Stats({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const { money } = useApp();
  const total = summary?.total_amount ?? 0;
  const prev = summary?.previous_total ?? null;
  const top = summary?.category_breakdown[0];
  const max = summary?.max_expense;
  const n = summary?.total_count ?? 0;

  let cmp: string | undefined;
  if (prev !== null && prev > 0) {
    const pct = Math.round(((total - prev) / prev) * 100);
    cmp = `${pct > 0 ? "+" : ""}${pct}% к прошлому месяцу`;
  } else if (prev === 0 && total > 0) cmp = "в прошлом месяце трат не было";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Всего" loading={loading} sub={cmp} value={money(total)} />
      <Stat label="В день" loading={loading} sub={`${n} ${plural(n, "запись", "записи", "записей")}`} value={money(summary?.avg_per_day ?? 0)} />
      <Stat label="Главная категория" loading={loading} sub={top ? `${top.percentage}% трат` : undefined} value={top?.category ?? "—"} />
      <Stat label="Крупнейшая трата" loading={loading} sub={max?.description || max?.category} value={max ? money(max.amount) : "—"} />
    </div>
  );
}
