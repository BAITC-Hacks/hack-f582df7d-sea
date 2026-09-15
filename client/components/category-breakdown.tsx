"use client";

import { Card, EmptyState, Skeleton } from "@heroui/react";

import { Donut } from "@/components/donut";
import { useApp } from "@/app/providers";
import { colorOf } from "@/lib/categories";
import type { Summary } from "@/types";

export function CategoryBreakdown({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const { money } = useApp();
  const cats = summary?.category_breakdown ?? [];
  const total = summary?.total_amount ?? 0;
  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title>По категориям</Card.Title>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="flex gap-6">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : cats.length === 0 ? (
          <EmptyState className="py-10">
            <p className="text-sm text-muted">Нет расходов за этот месяц</p>
          </EmptyState>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Donut data={cats} total={total} />
            <ul className="flex w-full flex-col gap-2.5">
              {cats.map((c) => (
                <li key={c.category} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(c.category) }} />
                      {c.category}
                      <span className="text-xs text-muted">{c.count}</span>
                    </span>
                    <span className="tabular-nums">
                      {money(c.total_amount)}
                      <span className="ml-2 inline-block w-10 text-right text-xs text-muted">{c.percentage}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-default-soft">
                    <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, background: colorOf(c.category) }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
