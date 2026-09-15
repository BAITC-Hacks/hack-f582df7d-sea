"use client";

import { Tooltip } from "@heroui/react";

import { useApp } from "@/app/providers";
import { colorOf } from "@/lib/categories";
import { MONTHS_SHORT, WEEKDAYS, pad } from "@/lib/api";
import type { Expense } from "@/types";

export function CalendarHeatmap({ items, year, month }: { items: Expense[]; year: number; month: number }) {
  const { money } = useApp();
  const days = new Date(year, month, 0).getDate();
  const first = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const byDay = new Map<number, number>();
  for (const e of items) byDay.set(Number(e.date.slice(8)), (byDay.get(Number(e.date.slice(8))) ?? 0) + e.amount);
  const max = Math.max(...Array.from(byDay.values()), 0);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAYS.map((w) => (
        <div key={w} className="pb-1 text-center text-[10px] text-muted">
          {w}
        </div>
      ))}
      {Array.from({ length: first }).map((_, i) => (
        <div key={`e${i}`} />
      ))}
      {Array.from({ length: days }).map((_, i) => {
        const d = i + 1;
        const v = byDay.get(d) ?? 0;
        const a = max > 0 ? 0.12 + (v / max) * 0.88 : 0;
        return (
          <Tooltip key={d} delay={0}>
            <Tooltip.Trigger className="relative aspect-square rounded-md bg-default-soft" tabIndex={0}>
              {v > 0 && <div className="absolute inset-0 rounded-md bg-foreground" style={{ opacity: a }} />}
              <span className={v > 0 && a > 0.5 ? "absolute left-1.5 top-1 text-[10px] text-background" : "absolute left-1.5 top-1 text-[10px] text-muted"}>{d}</span>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {pad(d)}.{pad(month)}: {v > 0 ? money(v) : "нет трат"}
            </Tooltip.Content>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function WeekdayChart({ items }: { items: Expense[] }) {
  const { money } = useApp();
  const sums = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];
  for (const e of items) {
    const [y, m, d] = e.date.split("-").map(Number);
    const wd = (new Date(y, m - 1, d).getDay() + 6) % 7;
    sums[wd] += e.amount;
    counts[wd] += 1;
  }
  const max = Math.max(...sums, 0);
  return (
    <div className="flex h-36 items-end gap-2">
      {sums.map((v, i) => (
        <Tooltip key={i} delay={0}>
          <Tooltip.Trigger className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" tabIndex={0}>
            <div className="w-full rounded-sm bg-foreground/70" style={{ height: `calc(${max > 0 ? (v / max) * 100 : 0}% - 18px)`, minHeight: 2 }} />
            <span className="text-[10px] text-muted">{WEEKDAYS[i]}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            {WEEKDAYS[i]}: {money(v)} · {counts[i]}
          </Tooltip.Content>
        </Tooltip>
      ))}
    </div>
  );
}

export function CategoryTrend({ items, categories, current }: { items: Expense[]; categories: string[]; current?: number }) {
  const { money } = useApp();
  const matrix = Array.from({ length: 12 }, () => new Map<string, number>());
  for (const e of items) {
    const m = Number(e.date.slice(5, 7)) - 1;
    matrix[m].set(e.category, (matrix[m].get(e.category) ?? 0) + e.amount);
  }
  const totals = matrix.map((m) => Array.from(m.values()).reduce((a, b) => a + b, 0));
  const max = Math.max(...totals, 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-44 items-end gap-1.5">
        {matrix.map((m, i) => (
          <Tooltip key={i} delay={0}>
            <Tooltip.Trigger className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" tabIndex={0}>
              <div className="flex w-full flex-col-reverse overflow-hidden rounded-sm" style={{ height: `calc(${max > 0 ? (totals[i] / max) * 100 : 0}% - 18px)`, minHeight: totals[i] > 0 ? 2 : 0 }}>
                {categories.map((c) => {
                  const v = m.get(c) ?? 0;
                  return v > 0 ? <div key={c} style={{ height: `${(v / totals[i]) * 100}%`, background: colorOf(c) }} /> : null;
                })}
              </div>
              <span className={i + 1 === current ? "text-[10px] text-foreground" : "text-[10px] text-muted"}>{MONTHS_SHORT[i]}</span>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-medium">
                  {MONTHS_SHORT[i]} · {money(totals[i])}
                </span>
                {categories
                  .filter((c) => (m.get(c) ?? 0) > 0)
                  .map((c) => (
                    <span key={c}>
                      {c}: {money(m.get(c) ?? 0)}
                    </span>
                  ))}
              </div>
            </Tooltip.Content>
          </Tooltip>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {categories.map((c) => (
          <span key={c} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(c) }} />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
