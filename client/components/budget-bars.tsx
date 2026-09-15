"use client";

import { Chip, ProgressBar } from "@heroui/react";

import { useApp } from "@/app/providers";
import { colorOf } from "@/lib/categories";
import type { Budget, CategorySummary } from "@/types";
import { TOTAL_BUDGET } from "@/types";

export function BudgetBars({ budgets, cats, total }: { budgets: Budget[]; cats: CategorySummary[]; total: number }) {
  const { money } = useApp();
  const spent = new Map(cats.map((c) => [c.category, c.total_amount]));
  const rows = budgets
    .map((b) => ({ ...b, spent: b.category === TOTAL_BUDGET ? total : (spent.get(b.category) ?? 0) }))
    .sort((a, b) => (a.category === TOTAL_BUDGET ? -1 : b.category === TOTAL_BUDGET ? 1 : b.spent / b.amount - a.spent / a.amount));
  return (
    <div className="flex flex-col gap-4">
      {rows.map((b) => {
        const pct = (b.spent / b.amount) * 100;
        const over = pct > 100;
        const isTotal = b.category === TOTAL_BUDGET;
        return (
          <ProgressBar key={b.category} aria-label={b.category} color={over ? "danger" : pct > 80 ? "warning" : "default"} maxValue={b.amount} size="sm" value={Math.min(b.spent, b.amount)}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {!isTotal && <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(b.category) }} />}
                <span className={isTotal ? "font-medium" : undefined}>{isTotal ? "Общий лимит" : b.category}</span>
                {over && (
                  <Chip color="danger" size="sm" variant="soft">
                    +{money(b.spent - b.amount)}
                  </Chip>
                )}
              </span>
              <span className="tabular-nums text-muted">
                {money(b.spent)} / {money(b.amount)}
              </span>
            </div>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        );
      })}
    </div>
  );
}
