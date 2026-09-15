"use client";

import { Card } from "@heroui/react";

import { MONTHS_SHORT, formatMoney } from "@/lib/api";
import type { MonthBreakdown } from "@/types";

interface Props {
  data: MonthBreakdown[];
  year: number;
  current: number;
  onSelect: (m: number) => void;
}

export function MonthlyChart({ data, year, current, onSelect }: Props) {
  const max = Math.max(...data.map((d) => d.total_amount), 0);
  const yearTotal = data.reduce((s, d) => s + d.total_amount, 0);
  return (
    <Card>
      <Card.Header className="flex-row items-baseline justify-between">
        <Card.Title>{year}</Card.Title>
        <Card.Description className="tabular-nums">{formatMoney(yearTotal)}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex h-32 items-end gap-1.5">
          {data.map((d) => {
            const h = max > 0 ? (d.total_amount / max) * 100 : 0;
            const active = d.month === current;
            return (
              <button
                key={d.month}
                aria-label={`${d.month_name}: ${formatMoney(d.total_amount)}`}
                className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1.5"
                type="button"
                onClick={() => onSelect(d.month)}
              >
                <div
                  className={active ? "w-full rounded-sm bg-foreground" : "w-full rounded-sm bg-foreground/15 group-hover:bg-foreground/30"}
                  style={{ height: `${Math.max(h, 2)}%` }}
                />
                <span className={active ? "text-[10px] text-foreground" : "text-[10px] text-muted"}>{MONTHS_SHORT[d.month - 1]}</span>
              </button>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}
