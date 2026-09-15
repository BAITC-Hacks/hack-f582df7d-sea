"use client";

import { useMemo } from "react";
import { Card, Skeleton, Table, Tabs } from "@heroui/react";

import { CalendarHeatmap, CategoryTrend, WeekdayChart } from "@/components/charts";
import { Donut } from "@/components/donut";
import { MonthNav } from "@/components/month-nav";
import { useApp } from "@/app/providers";
import { colorOf } from "@/lib/categories";
import { MONTHS_SHORT, compact } from "@/lib/api";
import { useSummary, useYear } from "@/lib/hooks";

export default function AnalyticsPage() {
  const { data, loading, year, month } = useSummary();
  const { items: yearItems, loading: yearLoading } = useYear(year);
  const { money } = useApp();

  const categories = useMemo(() => {
    const sums = new Map<string, number>();
    for (const e of yearItems) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
    return Array.from(sums.entries()).sort((a, b) => b[1] - a[1]);
  }, [yearItems]);

  const yearTotal = yearItems.reduce((s, e) => s + e.amount, 0);
  const activeMonths = new Set(yearItems.map((e) => e.date.slice(0, 7))).size;
  const monthItems = data?.items ?? [];
  const recipients = data?.recipient_breakdown ?? [];

  const matrix = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const e of yearItems) {
      const row = m.get(e.category) ?? Array(12).fill(0);
      row[Number(e.date.slice(5, 7)) - 1] += e.amount;
      m.set(e.category, row);
    }
    return m;
  }, [yearItems]);

  return (
    <div className="flex flex-col gap-4">
      <MonthNav title="Аналитика" />

      <Tabs defaultSelectedKey="month">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Период">
            <Tabs.Tab id="month">
              Месяц
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="year">
              Год
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="flex flex-col gap-4 pt-4" id="month">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <Card.Header className="flex-row items-baseline justify-between">
                <Card.Title>Календарь трат</Card.Title>
                <Card.Description>темнее — больше</Card.Description>
              </Card.Header>
              <Card.Content>{loading ? <Skeleton className="h-64 w-full" /> : <CalendarHeatmap items={monthItems} month={month} year={year} />}</Card.Content>
            </Card>
            <div className="flex flex-col gap-4">
              <Card>
                <Card.Header>
                  <Card.Title>По дням недели</Card.Title>
                </Card.Header>
                <Card.Content>{loading ? <Skeleton className="h-36 w-full" /> : <WeekdayChart items={monthItems} />}</Card.Content>
              </Card>
              <Card>
                <Card.Header>
                  <Card.Title>На кого</Card.Title>
                </Card.Header>
                <Card.Content>
                  {recipients.length === 0 ? (
                    <p className="text-sm text-muted">Получатели не указаны</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {recipients.map((r) => {
                        const pct = data ? (r.total_amount / data.total_amount) * 100 : 0;
                        return (
                          <li key={r.recipient} className="text-sm">
                            <div className="flex justify-between">
                              <span>{r.recipient}</span>
                              <span className="tabular-nums">
                                {money(r.total_amount)} <span className="text-xs text-muted">{Math.round(pct)}%</span>
                              </span>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-default-soft">
                              <div className="h-full bg-foreground/60" style={{ width: `${pct}%` }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card.Content>
              </Card>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel className="flex flex-col gap-4 pt-4" id="year">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Всего за год", money(yearTotal)],
              ["В среднем за месяц", money(activeMonths ? Math.round(yearTotal / activeMonths) : 0)],
              ["Активных месяцев", String(activeMonths)],
              ["Записей", String(yearItems.length)],
            ].map(([l, v]) => (
              <Card key={l} variant="secondary">
                <Card.Content className="flex flex-col gap-1 p-4">
                  <span className="text-xs text-muted">{l}</span>
                  {yearLoading ? <Skeleton className="h-7 w-24" /> : <span className="text-xl font-semibold tabular-nums">{v}</span>}
                </Card.Content>
              </Card>
            ))}
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Категории по месяцам</Card.Title>
            </Card.Header>
            <Card.Content>
              {yearLoading ? <Skeleton className="h-44 w-full" /> : <CategoryTrend categories={categories.map((c) => c[0])} current={month} items={yearItems} />}
            </Card.Content>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <Card.Header>
                <Card.Title>Структура года</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col items-center gap-4">
                <Donut data={categories.map(([category, total_amount]) => ({ category, total_amount, count: 0, percentage: yearTotal ? Math.round((total_amount / yearTotal) * 1000) / 10 : 0 }))} total={yearTotal} />
                <ul className="flex w-full flex-col gap-1.5">
                  {categories.map(([c, v]) => (
                    <li key={c} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(c) }} />
                        {c}
                      </span>
                      <span className="tabular-nums">{money(v)}</span>
                    </li>
                  ))}
                </ul>
              </Card.Content>
            </Card>
            <Card className="lg:col-span-2">
              <Card.Header>
                <Card.Title>Таблица</Card.Title>
              </Card.Header>
              <Card.Content>
                <Table.Root>
                  <Table.ScrollContainer>
                    <Table.Content aria-label="Категории по месяцам">
                      <Table.Header>
                        <Table.Column isRowHeader>Категория</Table.Column>
                        {MONTHS_SHORT.map((m) => (
                          <Table.Column key={m} className="text-right">
                            {m}
                          </Table.Column>
                        ))}
                        <Table.Column className="text-right">Год</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {categories.map(([c]) => {
                          const row = matrix.get(c) ?? [];
                          return (
                            <Table.Row key={c}>
                              <Table.Cell className="whitespace-nowrap">{c}</Table.Cell>
                              {row.map((v, i) => (
                                <Table.Cell key={i} className={v ? "text-right tabular-nums" : "text-right text-muted"}>
                                  {v ? compact(v) : "·"}
                                </Table.Cell>
                              ))}
                              <Table.Cell className="text-right font-medium tabular-nums">{compact(row.reduce((a, b) => a + b, 0))}</Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table.Root>
              </Card.Content>
            </Card>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
