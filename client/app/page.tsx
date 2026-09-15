"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Modal } from "@heroui/react";

import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { MonthlyChart } from "@/components/monthly-chart";
import { Stats } from "@/components/stats";
import { SummaryPanel } from "@/components/summary";
import { MONTHS, api, pad, todayIso } from "@/lib/api";
import type { Category, Expense, ExpenseInput, Summary } from "@/types";

export default function Home() {
  const [ym, setYm] = useState(() => todayIso().slice(0, 7));
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [adding, setAdding] = useState(false);

  const [year, month] = useMemo(() => ym.split("-").map(Number), [ym]);
  const isCurrent = ym === todayIso().slice(0, 7);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSummary(await api.summary(year, month));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  }, [year, month]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goTo = async (target: string) => {
    if (target !== ym) setYm(target);
    else await load();
  };

  const handleCreate = async (data: ExpenseInput) => {
    await api.create(data);
    setAdding(false);
    await goTo(data.date.slice(0, 7));
  };

  const handleUpdate = async (data: ExpenseInput) => {
    if (!editing) return;
    await api.update(editing.id, data);
    setEditing(null);
    await goTo(data.date.slice(0, 7));
  };

  const handleDelete = async (id: number) => {
    await api.remove(id);
    await load();
  };

  const handleSeed = async () => {
    await api.seed();
    await goTo(todayIso().slice(0, 7));
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYm(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  const defaultDate = isCurrent ? todayIso() : `${ym}-01`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-1">
          <Button isIconOnly aria-label="Предыдущий месяц" size="sm" variant="ghost" onPress={() => shiftMonth(-1)}>
            ‹
          </Button>
          <h1 className="min-w-[180px] text-center text-xl font-semibold tracking-tight">
            {MONTHS[month - 1]} {year}
          </h1>
          <Button isIconOnly aria-label="Следующий месяц" size="sm" variant="ghost" onPress={() => shiftMonth(1)}>
            ›
          </Button>
          {!isCurrent && (
            <Button size="sm" variant="ghost" onPress={() => setYm(todayIso().slice(0, 7))}>
              Сегодня
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onPress={handleSeed}>
            Пример
          </Button>
          <Button className="lg:hidden" size="sm" variant="primary" onPress={() => setAdding(true)}>
            Добавить
          </Button>
        </div>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
          <Button size="sm" variant="tertiary" onPress={load}>
            Повторить
          </Button>
        </Alert>
      )}

      <Stats summary={summary} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="hidden lg:col-span-2 lg:block">
          <Card.Header>
            <Card.Title>Новый расход</Card.Title>
          </Card.Header>
          <Card.Content>
            <ExpenseForm key={ym} categories={categories} defaultDate={defaultDate} onSubmit={handleCreate} />
          </Card.Content>
        </Card>
        <div className="lg:col-span-3">
          <SummaryPanel summary={summary} />
        </div>
      </div>

      {summary?.monthly_breakdown && (
        <MonthlyChart current={month} data={summary.monthly_breakdown} year={year} onSelect={(m) => setYm(`${year}-${pad(m)}`)} />
      )}

      <ExpenseList exportUrl={api.exportUrl(year, month)} items={summary?.items ?? []} onDelete={handleDelete} onEdit={setEditing} />

      <Modal isOpen={adding} onOpenChange={setAdding}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Новый расход</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <ExpenseForm categories={categories} defaultDate={defaultDate} onCancel={() => setAdding(false)} onSubmit={handleCreate} />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Изменить расход</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {editing && (
                  <ExpenseForm
                    key={editing.id}
                    categories={categories}
                    defaultDate={defaultDate}
                    initial={editing}
                    submitLabel="Сохранить"
                    onCancel={() => setEditing(null)}
                    onSubmit={handleUpdate}
                  />
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
