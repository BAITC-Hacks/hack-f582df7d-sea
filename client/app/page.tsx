"use client";

import NextLink from "next/link";
import { Alert, Button, Card, Skeleton } from "@heroui/react";

import { BudgetBars } from "@/components/budget-bars";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { ExpenseTable } from "@/components/expense-table";
import { MonthNav } from "@/components/month-nav";
import { MonthlyChart } from "@/components/monthly-chart";
import { Stats } from "@/components/stats";
import { useApp } from "@/app/providers";
import { useBudgets, useSummary } from "@/lib/hooks";

export default function Dashboard() {
  const { data, error, loading, year, month } = useSummary();
  const budgets = useBudgets();
  const { setAddOpen, money } = useApp();
  const recent = data?.items.slice(0, 6) ?? [];
  const top = [...(data?.items ?? [])].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <MonthNav title="Обзор" />

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <Stats loading={loading} summary={data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CategoryBreakdown loading={loading} summary={data} />
        </div>
        <Card className="lg:col-span-2">
          <Card.Header className="flex-row items-baseline justify-between">
            <Card.Title>Бюджет</Card.Title>
            <NextLink className="text-xs text-link hover:underline" href="/budget">
              Настроить
            </NextLink>
          </Card.Header>
          <Card.Content>
            {budgets.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-2">
                <p className="text-sm text-muted">Лимиты не заданы</p>
                <NextLink className="button button--secondary button--sm" href="/budget">
                  Задать бюджет
                </NextLink>
              </div>
            ) : (
              <BudgetBars budgets={budgets} cats={data?.category_breakdown ?? []} total={data?.total_amount ?? 0} />
            )}
          </Card.Content>
        </Card>
      </div>

      {data?.monthly_breakdown && <MonthlyChart current={month} data={data.monthly_breakdown} year={year} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <Card.Header className="flex-row items-baseline justify-between">
            <Card.Title>Последние</Card.Title>
            <NextLink className="text-xs text-link hover:underline" href="/expenses">
              Все записи
            </NextLink>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-2">
                <p className="text-sm text-muted">Записей нет</p>
                <Button size="sm" variant="secondary" onPress={() => setAddOpen(true)}>
                  Добавить первый расход
                </Button>
              </div>
            ) : (
              <ExpenseTable compact items={recent} pageSize={6} />
            )}
          </Card.Content>
        </Card>
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Крупнейшие</Card.Title>
          </Card.Header>
          <Card.Content>
            {top.length === 0 ? (
              <p className="text-sm text-muted">Записей нет</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {top.map((e, i) => (
                  <li key={e.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-xs tabular-nums text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {e.description || e.category}
                      <span className="ml-2 text-xs text-muted">{e.category}</span>
                    </span>
                    <span className="tabular-nums">{money(e.amount)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
