"use client";

import { useEffect, useState } from "react";

import { Card, colorOf, inputCls } from "@/components/ui";
import { formatMoney } from "@/lib/api";
import type { Summary } from "@/types";

const BUDGET_KEY = "expenses.monthlyBudget";

function Donut({ data }: { data: Summary["category_breakdown"] }) {
  const total = data.reduce((s, c) => s + c.total_amount, 0);
  if (total <= 0) return null;
  const r = 44;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg className="h-36 w-36 shrink-0" viewBox="0 0 120 120">
      <circle cx="60" cy="60" fill="none" r={r} stroke="currentColor" strokeOpacity="0.08" strokeWidth="18" />
      {data.map((c) => {
        const len = (c.total_amount / total) * C;
        const el = (
          <circle
            key={c.category}
            cx="60"
            cy="60"
            fill="none"
            r={r}
            stroke={colorOf(c.category)}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
            strokeWidth="18"
            transform="rotate(-90 60 60)"
          >
            <title>{`${c.category}: ${formatMoney(c.total_amount)} (${c.percentage}%)`}</title>
          </circle>
        );
        offset += len;
        return el;
      })}
      <text className="fill-current text-[11px] font-semibold" textAnchor="middle" x="60" y="64">
        {data.length} кат.
      </text>
    </svg>
  );
}

export function SummaryPanel({ summary, monthLabel }: { summary: Summary | null; monthLabel: string }) {
  const [budget, setBudget] = useState<string>("");

  useEffect(() => {
    try {
      setBudget(localStorage.getItem(BUDGET_KEY) ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  const onBudgetChange = (v: string) => {
    setBudget(v);
    try {
      localStorage.setItem(BUDGET_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const total = summary?.total_amount ?? 0;
  const count = summary?.total_count ?? 0;
  const cats = summary?.category_breakdown ?? [];
  const catSum = Math.round(cats.reduce((s, c) => s + c.total_amount, 0) * 100) / 100;
  const budgetNum = Number(budget.replace(",", "."));
  const hasBudget = budget.trim() !== "" && Number.isFinite(budgetNum) && budgetNum > 0;
  const budgetPct = hasBudget ? Math.min(100, (total / budgetNum) * 100) : 0;

  return (
    <Card title={`Итоги · ${monthLabel}`}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-accent/10 p-3">
            <p className="text-xs text-muted">Всего за месяц</p>
            <p className="text-2xl font-bold text-accent">{formatMoney(total)}</p>
          </div>
          <div className="rounded-xl bg-background p-3">
            <p className="text-xs text-muted">Записей</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label className="flex items-center justify-between gap-2">
            <span className="font-medium">Бюджет на месяц (опционально)</span>
            <input
              className={inputCls + " max-w-[140px] text-right"}
              inputMode="decimal"
              placeholder="напр. 50000"
              value={budget}
              onChange={(e) => onBudgetChange(e.target.value)}
            />
          </label>
          {hasBudget && (
            <>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                <div
                  className={total > budgetNum ? "h-full bg-danger" : "h-full bg-success"}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className={total > budgetNum ? "text-xs text-danger" : "text-xs text-muted"}>
                {total > budgetNum
                  ? `Бюджет превышен на ${formatMoney(total - budgetNum)}`
                  : `Осталось ${formatMoney(budgetNum - total)} из ${formatMoney(budgetNum)}`}
              </p>
            </>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">По категориям</h3>
          {cats.length === 0 ? (
            <p className="text-sm text-muted">Пока нет расходов за этот месяц.</p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Donut data={cats} />
              <ul className="flex w-full flex-col gap-2">
                {cats.map((c) => (
                  <li key={c.category} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ background: colorOf(c.category) }} />
                        {c.category}
                        <span className="text-xs text-muted">({c.count})</span>
                      </span>
                      <span className="font-medium">
                        {formatMoney(c.total_amount)}{" "}
                        <span className="text-xs text-muted">{c.percentage}%</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-background">
                      <div className="h-full" style={{ width: `${c.percentage}%`, background: colorOf(c.category) }} />
                    </div>
                  </li>
                ))}
                <li className="mt-1 flex items-center justify-between border-t border-separator pt-2 text-xs text-muted">
                  <span>Сумма категорий</span>
                  <span className={catSum === total ? "text-success" : "text-danger"}>
                    {formatMoney(catSum)} {catSum === total ? "= итог ✓" : "≠ итог"}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
