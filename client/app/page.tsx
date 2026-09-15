"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { SummaryPanel } from "@/components/summary";
import { Button, inputCls } from "@/components/ui";
import { api } from "@/lib/api";
import type { Category, Expense, Summary } from "@/types";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const pad = (n: number) => String(n).padStart(2, "0");
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function Home() {
  const [ym, setYm] = useState(() => todayIso().slice(0, 7)); // YYYY-MM
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [year, month] = useMemo(() => ym.split("-").map(Number), [ym]);
  const monthLabel = `${MONTHS[month - 1] ?? ""} ${year}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await api.summary(year, month);
      setSummary(s);
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
    setTimeout(() => setNotice(null), 2500);
  };

  const handleCreate = async (data: Omit<Expense, "id">) => {
    await api.create(data);
    const created = data.date.slice(0, 7);
    if (created !== ym) {
      setYm(created); // переключаемся на месяц добавленной траты — load() вызовется сам
      flash(`Расход добавлен. Показан ${MONTHS[Number(created.slice(5)) - 1]} ${created.slice(0, 4)}.`);
    } else {
      await load();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.remove(id);
      await load();
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
      flash("Загружен проверочный пример: ожидается итог 3 000 ₸.");
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button aria-label="Предыдущий месяц" variant="secondary" onClick={() => shiftMonth(-1)}>
            ‹
          </Button>
          <input
            aria-label="Месяц"
            className={inputCls + " w-auto"}
            type="month"
            value={ym}
            onChange={(e) => e.target.value && setYm(e.target.value)}
          />
          <Button aria-label="Следующий месяц" variant="secondary" onClick={() => shiftMonth(1)}>
            ›
          </Button>
          <Button variant="ghost" onClick={() => setYm(todayIso().slice(0, 7))}>
            Сегодня
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleSeed}>
            Проверочный пример
          </Button>
          <Button variant="danger" onClick={handleClear}>
            Очистить всё
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <span>{error}</span>
          <Button className="px-2 py-1" variant="secondary" onClick={load}>
            Повторить
          </Button>
        </div>
      )}
      {notice && <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{notice}</div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ExpenseForm categories={categories} defaultDate={todayIso()} onSubmit={handleCreate} />
        </div>
        <div className="lg:col-span-3">
          <SummaryPanel monthLabel={monthLabel} summary={summary} />
        </div>
      </div>

      <ExpenseList items={summary?.items ?? []} loading={loading} onDelete={handleDelete} />
    </div>
  );
}
