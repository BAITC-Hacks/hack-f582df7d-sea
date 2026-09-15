"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Label, TextField, toast } from "@heroui/react";

import { BudgetBars } from "@/components/budget-bars";
import { MonthNav } from "@/components/month-nav";
import { useApp } from "@/app/providers";
import { api } from "@/lib/api";
import { colorOf } from "@/lib/categories";
import { useBudgets, useCategories, useSummary } from "@/lib/hooks";
import { TOTAL_BUDGET } from "@/types";

export default function BudgetPage() {
  const { data } = useSummary();
  const budgets = useBudgets();
  const categories = useCategories();
  const { refresh, money } = useApp();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(Object.fromEntries(budgets.map((b) => [b.category, String(b.amount)])));
  }, [budgets]);

  const save = async () => {
    setSaving(true);
    try {
      const items = Object.entries(form)
        .map(([category, v]) => ({ category, amount: Number(v.replace(",", ".")) || 0 }))
        .filter((b) => b.amount > 0);
      await api.saveBudgets(items);
      refresh();
      toast.success("Бюджет сохранён");
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const catSum = categories.reduce((s, c) => s + (Number(form[c.name]?.replace(",", ".")) || 0), 0);
  const totalBudget = Number(form[TOTAL_BUDGET]?.replace(",", ".")) || 0;

  return (
    <div className="flex flex-col gap-4">
      <MonthNav title="Бюджет" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Лимиты на месяц</Card.Title>
            <Card.Description>Пустое поле — без лимита</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            <TextField fullWidth value={form[TOTAL_BUDGET] ?? ""} onChange={(v) => setForm({ ...form, [TOTAL_BUDGET]: v })}>
              <Label>Общий лимит</Label>
              <Input inputMode="decimal" placeholder="0" />
            </TextField>
            <div className="my-1 border-t border-separator" />
            {categories.map((c) => (
              <TextField key={c.key} fullWidth value={form[c.name] ?? ""} onChange={(v) => setForm({ ...form, [c.name]: v })}>
                <Label>
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: colorOf(c.name) }} />
                  {c.name}
                </Label>
                <Input inputMode="decimal" placeholder="0" />
              </TextField>
            ))}
            {totalBudget > 0 && catSum > totalBudget && <p className="text-xs text-warning">Сумма лимитов по категориям ({money(catSum)}) больше общего лимита.</p>}
            <Button className="mt-2" isDisabled={saving} variant="primary" onPress={save}>
              Сохранить
            </Button>
          </Card.Content>
        </Card>
        <Card className="lg:col-span-3">
          <Card.Header>
            <Card.Title>Использование</Card.Title>
          </Card.Header>
          <Card.Content>
            {budgets.length === 0 ? (
              <p className="text-sm text-muted">Лимиты пока не заданы.</p>
            ) : (
              <BudgetBars budgets={budgets} cats={data?.category_breakdown ?? []} total={data?.total_amount ?? 0} />
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
