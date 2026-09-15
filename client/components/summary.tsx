"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, Input, ProgressBar, Separator, TextField } from "@heroui/react";

import { colorOf } from "@/lib/categories";
import { formatMoney } from "@/lib/api";
import type { Summary } from "@/types";

const BUDGET_KEY = "expenses.budget";

function Donut({ data, total }: { data: Summary["category_breakdown"]; total: number }) {
  const r = 46;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg className="h-40 w-40 shrink-0" viewBox="0 0 120 120">
      <circle cx="60" cy="60" fill="none" r={r} stroke="currentColor" strokeOpacity="0.06" strokeWidth="12" />
      {data.map((c) => {
        const len = (c.total_amount / total) * C;
        const gap = data.length > 1 ? 1.5 : 0;
        const el = (
          <circle
            key={c.category}
            cx="60"
            cy="60"
            fill="none"
            r={r}
            stroke={colorOf(c.category)}
            strokeDasharray={`${Math.max(len - gap, 0)} ${C - Math.max(len - gap, 0)}`}
            strokeDashoffset={-offset}
            strokeWidth="12"
            transform="rotate(-90 60 60)"
          />
        );
        offset += len;
        return el;
      })}
      <text className="fill-current text-[11px] font-semibold" textAnchor="middle" x="60" y="64">
        {new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(total)}
      </text>
    </svg>
  );
}

export function SummaryPanel({ summary }: { summary: Summary | null }) {
  const [budget, setBudget] = useState("");

  useEffect(() => {
    try {
      setBudget(localStorage.getItem(BUDGET_KEY) ?? "");
    } catch {}
  }, []);

  const onBudgetChange = (v: string) => {
    setBudget(v);
    try {
      localStorage.setItem(BUDGET_KEY, v);
    } catch {}
  };

  const total = summary?.total_amount ?? 0;
  const cats = summary?.category_breakdown ?? [];
  const recipients = summary?.recipient_breakdown ?? [];
  const budgetNum = Number(budget.replace(",", "."));
  const hasBudget = budget.trim() !== "" && Number.isFinite(budgetNum) && budgetNum > 0;
  const over = hasBudget && total > budgetNum;

  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title>По категориям</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-5">
        {cats.length === 0 ? (
          <EmptyState className="py-8">
            <p className="text-sm text-muted">Нет расходов за этот месяц</p>
          </EmptyState>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <Donut data={cats} total={total} />
            <ul className="flex w-full flex-col gap-2">
              {cats.map((c) => (
                <li key={c.category} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(c.category) }} />
                    {c.category}
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(c.total_amount)}
                    <span className="ml-2 inline-block w-10 text-right text-xs text-muted">{c.percentage}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipients.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">На кого</span>
              {recipients.map((r) => (
                <div key={r.recipient} className="flex items-center justify-between text-sm">
                  <span>{r.recipient}</span>
                  <span className="tabular-nums">{formatMoney(r.total_amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">Бюджет на месяц</span>
            <TextField aria-label="Бюджет" className="w-36" value={budget} onChange={onBudgetChange}>
              <Input className="text-right" inputMode="decimal" placeholder="не задан" />
            </TextField>
          </div>
          {hasBudget && (
            <ProgressBar aria-label="Бюджет" color={over ? "danger" : "default"} maxValue={budgetNum} size="sm" value={Math.min(total, budgetNum)}>
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
              <span className={over ? "text-xs text-danger" : "text-xs text-muted"}>
                {over ? `Превышен на ${formatMoney(total - budgetNum)}` : `Осталось ${formatMoney(budgetNum - total)}`}
              </span>
            </ProgressBar>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
