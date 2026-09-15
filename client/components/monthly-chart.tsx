"use client";

import { Card, Tooltip } from "@heroui/react";

import { useApp } from "@/app/providers";
import { MONTHS_SHORT, pad } from "@/lib/api";
import type { MonthBreakdown } from "@/types";

export function MonthlyChart({ data, year, current }: { data: MonthBreakdown[]; year: number; current: number }) {
  const { money, setYm } = useApp();
  const max = Math.max(...data.map((d) => d.total_amount), 0);
  const yearTotal = data.reduce((s, d) => s + d.total_amount, 0);
  const avg = yearTotal / Math.max(1, data.filter((d) => d.total_amount > 0).length);
  return (
    <Card>
      <Card.Header className="flex-row items-baseline justify-between">
        <Card.Title>По месяцам · {year}</Card.Title>
        <Card.Description className="tabular-nums">
          {money(yearTotal)} · в среднем {money(Math.round(avg))}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="relative flex h-36 items-end gap-1.5">
          {max > 0 && avg > 0 && (
            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-separator" style={{ bottom: `calc(${(avg / max) * 100}% * (100% - 20px) / 100% + 20px)` }} />
          )}
          {data.map((d) => {
            const h = max > 0 ? (d.total_amount / max) * 100 : 0;
            const active = d.month === current;
            return (
              <Tooltip key={d.month} delay={0}>
                <Tooltip.Trigger className="flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1.5" onClick={() => setYm(`${year}-${pad(d.month)}`)}>
                  <div
                    className={active ? "w-full rounded-sm bg-foreground" : "w-full rounded-sm bg-foreground/15 transition hover:bg-foreground/35"}
                    style={{ height: `calc(${Math.max(h, 1.5)}% - 20px)` }}
                  />
                  <span className={active ? "text-[10px] text-foreground" : "text-[10px] text-muted"}>{MONTHS_SHORT[d.month - 1]}</span>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {d.month_name}: {money(d.total_amount)}
                </Tooltip.Content>
              </Tooltip>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}
