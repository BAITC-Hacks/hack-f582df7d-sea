"use client";

import { useEffect, useState } from "react";

import { Card, colorOf, iconOf, inputCls } from "@/components/ui";
import { formatMoney } from "@/lib/api";
import type { Summary } from "@/types";

const BUDGET_KEY = "expenses.monthlyBudget";

function Donut({ data, total }: { data: Summary["category_breakdown"]; total: number }) {
  if (total <= 0) return null;
  const r = 46;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg className="h-44 w-44 shrink-0" viewBox="0 0 120 120">
      <circle cx="60" cy="60" fill="none" r={r} stroke="currentColor" strokeOpacity="0.06" strokeWidth="16" />
      {data.map((c) => {
        const len = (c.total_amount / total) * C;
        const el = (
          <circle
            key={c.category}
            className="transition-all"
            cx="60"
            cy="60"
            fill="none"
            r={r}
            stroke={colorOf(c.category)}
            strokeDasharray={`${Math.max(len - 1.5, 0)} ${C - Math.max(len - 1.5, 0)}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            strokeWidth="16"
            transform="rotate(-90 60 60)"
          >
            <title>{`${c.category}: ${formatMoney(c.total_amount)} (${c.percentage}%)`}</title>
          </circle>
        );
        offset += len;
        return el;
      })}
      <text className="fill-current text-[9px]" fillOpacity="0.6" textAnchor="middle" x="60" y="56">
        всего
      </text>
      <text className="fill-current text-[11px] font-bold" textAnchor="middle" x="60" y="70">
        {new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(total)} ₸
      </text>
    </svg>
  );
}

export function SummaryPanel({ summary }: { summary: Summary | null }) {
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
  const cats = summary?.category_breakdown ?? [];
  const recipients = summary?.recipient_breakdown ?? [];
  const catSum = Math.round(cats.reduce((s, c) => s + c.total_amount, 0) * 100) / 100;
  const budgetNum = Number(budget.replace(",", "."));
  const hasBudget = budget.trim() !== "" && Number.isFinite(budgetNum) && budgetNum > 0;
  const budgetPct = hasBudget ? Math.min(100, (total / budgetNum) * 100) : 0;

  return (
    <Card subtitle="суммы по категориям и контроль бюджета" title="Структура расходов">
      <div className="flex flex-col gap-5">
        {cats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-separator py-10 text-center">
            <span className="text-4xl">🧾</span>
            <p className="text-sm font-medium">Пока нет расходов за этот месяц</p>
            <p className="text-xs text-muted">Добавьте первую трату — здесь появится диаграмма</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <Donut data={cats} total={total} />
            <ul className="flex w-full flex-col gap-2.5">
              {cats.map((c) => (
                <li key={c.category} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-base">{iconOf(c.category)}</span>
                      <span className="font-medium">{c.category}</span>
                      <span className="text-xs text-muted">×{c.count}</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(c.total_amount)} <span className="ml-1 text-xs font-normal text-muted">{c.percentage}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.percentage}%`, background: colorOf(c.category) }} />
                  </div>
                </li>
              ))}
              <li className="mt-1 flex items-center justify-between border-t border-separator pt-2 text-xs text-muted">
                <span>Сумма категорий</span>
                <span className={catSum === total ? "font-medium text-success" : "font-medium text-danger"}>
                  {formatMoney(catSum)} {catSum === total ? "= итог ✓" : "≠ итог"}
                </span>
              </li>
            </ul>
          </div>
        )}

        {recipients.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">На кого потратили</h3>
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) => (
                <div key={r.recipient} className="flex items-center gap-2 rounded-xl bg-background px-3 py-1.5 text-sm">
                  <span className="font-medium">{r.recipient}</span>
                  <span className="tabular-nums text-muted">{formatMoney(r.total_amount)}</span>
                  <span className="text-xs text-muted">×{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Бюджет на месяц</p>
              <p className="text-xs text-muted">хранится в вашем браузере</p>
            </div>
            <input
              className={inputCls + " max-w-[150px] bg-surface text-right"}
              inputMode="decimal"
              placeholder="напр. 50000"
              value={budget}
              onChange={(e) => onBudgetChange(e.target.value)}
            />
          </div>
          {hasBudget && (
            <div className="mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className={
                    total > budgetNum ? "h-full rounded-full bg-danger" : budgetPct > 80 ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-success"
                  }
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className={total > budgetNum ? "mt-1.5 text-xs font-medium text-danger" : "mt-1.5 text-xs text-muted"}>
                {total > budgetNum
                  ? `Бюджет превышен на ${formatMoney(total - budgetNum)}`
                  : `Потрачено ${Math.round(budgetPct)}% · осталось ${formatMoney(budgetNum - total)} из ${formatMoney(budgetNum)}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
