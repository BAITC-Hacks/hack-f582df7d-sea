"use client";

import { Card } from "@/components/ui";
import { MONTHS_SHORT, formatMoney } from "@/lib/api";
import type { MonthBreakdown } from "@/types";

export function MonthlyChart({ data, year, current, onSelect }: { data: MonthBreakdown[]; year: number; current: number; onSelect: (m: number) => void }) {
  const max = Math.max(...data.map((d) => d.total_amount), 0);
  const yearTotal = data.reduce((s, d) => s + d.total_amount, 0);
  return (
    <Card subtitle={`итого за ${year}: ${formatMoney(yearTotal)} · нажмите на месяц, чтобы открыть`} title={`Динамика по месяцам · ${year}`}>
      {max === 0 ? (
        <p className="py-6 text-center text-sm text-muted">За {year} год расходов ещё нет.</p>
      ) : (
        <div className="flex h-44 items-end gap-1.5 sm:gap-2">
          {data.map((d) => {
            const h = max > 0 ? (d.total_amount / max) * 100 : 0;
            const active = d.month === current;
            return (
              <button
                key={d.month}
                className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1"
                title={`${d.month_name}: ${formatMoney(d.total_amount)} (${d.count})`}
                type="button"
                onClick={() => onSelect(d.month)}
              >
                <span className="hidden text-[10px] tabular-nums text-muted group-hover:block">
                  {d.total_amount > 0 ? new Intl.NumberFormat("ru-RU", { notation: "compact" }).format(d.total_amount) : ""}
                </span>
                <div
                  className={
                    active
                      ? "w-full rounded-t-lg bg-accent transition-all"
                      : "w-full rounded-t-lg bg-accent/25 transition-all group-hover:bg-accent/50"
                  }
                  style={{ height: `${Math.max(h, d.total_amount > 0 ? 3 : 1)}%` }}
                />
                <span className={active ? "text-[11px] font-semibold text-accent" : "text-[11px] text-muted"}>{MONTHS_SHORT[d.month - 1]}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
