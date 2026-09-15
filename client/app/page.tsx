"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { Modal } from "@/components/modal";
import { MonthlyChart } from "@/components/monthly-chart";
import { Stats } from "@/components/stats";
import { SummaryPanel } from "@/components/summary";
import { Button, Card, inputCls } from "@/components/ui";
import { MONTHS, api, pad, todayIso } from "@/lib/api";
import type { Category, Expense, ExpenseInput, Summary } from "@/types";

export default function Home() {
  const [ym, setYm] = useState(() => todayIso().slice(0, 7));
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const [year, month] = useMemo(() => ym.split("-").map(Number), [ym]);
  const monthLabel = `${MONTHS[month - 1] ?? ""} ${year}`;
  const isCurrent = ym === todayIso().slice(0, 7);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await api.summary(year, month));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCreate = async (data: ExpenseInput) => {
    await api.create(data);
    const created = data.date.slice(0, 7);
    setMobileFormOpen(false);
    if (created !== ym) {
      setYm(created);
      flash(`Расход добавлен. Открыт ${MONTHS[Number(created.slice(5)) - 1]} ${created.slice(0, 4)}.`);
    } else {
      await load();
    }
  };

  const handleUpdate = async (data: ExpenseInput) => {
    if (!editing) return;
    await api.update(editing.id, data);
    setEditing(null);
    const target = data.date.slice(0, 7);
    if (target !== ym) setYm(target);
    else await load();
    flash("Изменения сохранены.");
  };

  const handleDelete = async (id: number) => {
    try {
      await api.remove(id);
      await load();
      flash("Расход удалён.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить");
    }
  };

  const handleSeed = async () => {
    if (!confirm("Заменить все данные проверочным примером из ТЗ (1500 еда, 600 транспорт, 900 еда)?")) return;
    try {
      await api.seed();
      const now = todayIso().slice(0, 7);
      if (now !== ym) setYm(now);
      else await load();
      flash("Загружен проверочный пример: ожидается итог 3 000 ₸ (еда 2 400, транспорт 600).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleClear = async () => {
    if (!confirm("Удалить ВСЕ расходы за все месяцы? Это действие нельзя отменить.")) return;
    try {
      await api.clear();
      await load();
      flash("Все расходы удалены.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYm(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  const defaultDate = isCurrent ? todayIso() : `${ym}-01`;

  const form = (
    <ExpenseForm key={ym} categories={categories} defaultDate={defaultDate} onSubmit={handleCreate} />
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Заголовок + навигация по месяцам */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Отчёт за период</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{monthLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-separator bg-surface p-1">
            <Button aria-label="Предыдущий месяц" size="sm" variant="ghost" onClick={() => shiftMonth(-1)}>
              ‹
            </Button>
            <input
              aria-label="Месяц"
              className={inputCls + " w-auto border-0 bg-transparent py-1 text-xs focus:ring-0"}
              type="month"
              value={ym}
              onChange={(e) => e.target.value && setYm(e.target.value)}
            />
            <Button aria-label="Следующий месяц" size="sm" variant="ghost" onClick={() => shiftMonth(1)}>
              ›
            </Button>
          </div>
          {!isCurrent && (
            <Button size="sm" variant="secondary" onClick={() => setYm(todayIso().slice(0, 7))}>
              Сегодня
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleSeed}>
            Проверочный пример
          </Button>
          <Button size="sm" variant="danger" onClick={handleClear}>
            Очистить всё
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span>⚠ {error}</span>
          <Button size="sm" variant="secondary" onClick={load}>
            Повторить
          </Button>
        </div>
      )}
      {notice && <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">✓ {notice}</div>}

      <Stats summary={summary} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="hidden lg:col-span-5 lg:block">
          <Card subtitle="сумма, категория и дата обязательны" title="Добавить расход">
            {form}
          </Card>
        </div>
        <div className="lg:col-span-7">
          <SummaryPanel summary={summary} />
        </div>
      </div>

      {summary?.monthly_breakdown && (
        <MonthlyChart current={month} data={summary.monthly_breakdown} year={year} onSelect={(m) => setYm(`${year}-${pad(m)}`)} />
      )}

      <ExpenseList
        exportUrl={api.exportUrl(year, month)}
        items={summary?.items ?? []}
        loading={loading}
        onDelete={handleDelete}
        onEdit={setEditing}
      />

      {/* Мобильная кнопка добавления */}
      <button
        aria-label="Добавить расход"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent text-3xl text-white shadow-xl transition hover:brightness-110 active:scale-95 lg:hidden"
        onClick={() => setMobileFormOpen(true)}
      >
        +
      </button>
      <Modal open={mobileFormOpen} title="Добавить расход" onClose={() => setMobileFormOpen(false)}>
        {form}
      </Modal>

      <Modal open={!!editing} title="Редактировать расход" onClose={() => setEditing(null)}>
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
      </Modal>
    </div>
  );
}
