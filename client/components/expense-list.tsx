"use client";

import { useState } from "react";

import { Button, Card, colorOf } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/api";
import type { Expense } from "@/types";

interface Props {
  items: Expense[];
  loading: boolean;
  onDelete: (id: number) => Promise<void>;
}

export function ExpenseList({ items, loading, onDelete }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("");

  const cats = Array.from(new Set(items.map((i) => i.category)));
  const visible = filter ? items.filter((i) => i.category === filter) : items;

  const handleDelete = async (e: Expense) => {
    if (!confirm(`Удалить расход «${e.category} — ${formatMoney(e.amount)}»?`)) return;
    setDeleting(e.id);
    try {
      await onDelete(e.id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card
      action={
        cats.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <button
              className={`rounded-full px-3 py-1 text-xs ${filter === "" ? "bg-accent text-white" : "bg-background text-muted"}`}
              onClick={() => setFilter("")}
            >
              Все
            </button>
            {cats.map((c) => (
              <button
                key={c}
                className={`rounded-full px-3 py-1 text-xs ${filter === c ? "bg-accent text-white" : "bg-background text-muted"}`}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )
      }
      title={`Расходы за месяц (${items.length})`}
    >
      {loading && items.length === 0 ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-separator p-6 text-center text-sm text-muted">
          {items.length === 0
            ? "Список пуст. Добавьте первый расход через форму слева."
            : "Нет расходов в выбранной категории."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3">Дата</th>
                <th className="py-2 pr-3">Категория</th>
                <th className="py-2 pr-3">Описание</th>
                <th className="py-2 pr-3 text-right">Сумма</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr key={e.id} className="border-t border-separator">
                  <td className="whitespace-nowrap py-2 pr-3">{formatDate(e.date)}</td>
                  <td className="whitespace-nowrap py-2 pr-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colorOf(e.category) }} />
                      {e.category}
                    </span>
                  </td>
                  <td className="max-w-[260px] truncate py-2 pr-3 text-muted">{e.description || "—"}</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-right font-medium">{formatMoney(e.amount)}</td>
                  <td className="py-2 text-right">
                    <Button
                      aria-label="Удалить"
                      className="px-2 py-1"
                      disabled={deleting === e.id}
                      variant="danger"
                      onClick={() => handleDelete(e)}
                    >
                      {deleting === e.id ? "…" : "Удалить"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
