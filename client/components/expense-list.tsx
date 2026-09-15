"use client";

import { useMemo, useState } from "react";

import { Button, Card, Chip, colorOf, iconOf, inputCls } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/api";
import type { Expense } from "@/types";

interface Props {
  items: Expense[];
  loading: boolean;
  onDelete: (id: number) => Promise<void>;
  onEdit: (e: Expense) => void;
  exportUrl: string;
}

type Sort = "date" | "amount";

export function ExpenseList({ items, loading, onDelete, onEdit, exportUrl }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("date");

  const cats = Array.from(new Set(items.map((i) => i.category)));

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = items.filter((i) => (!filter || i.category === filter) && (!needle || `${i.description ?? ""} ${i.recipient ?? ""} ${i.category}`.toLowerCase().includes(needle)));
    if (sort === "amount") list = [...list].sort((a, b) => b.amount - a.amount);
    return list;
  }, [items, filter, q, sort]);

  const visibleTotal = visible.reduce((s, i) => s + i.amount, 0);

  const handleDelete = async (e: Expense) => {
    if (!confirm(`Удалить расход «${e.category} — ${formatMoney(e.amount)}»?`)) return;
    setDeleting(e.id);
    try {
      await onDelete(e.id);
    } finally {
      setDeleting(null);
    }
  };

  // группировка по дате
  const groups = useMemo(() => {
    if (sort !== "date") return [{ date: null as string | null, rows: visible }];
    const map = new Map<string, Expense[]>();
    for (const e of visible) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return Array.from(map.entries()).map(([date, rows]) => ({ date, rows }));
  }, [visible, sort]);

  return (
    <Card
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Поиск"
            className={inputCls + " w-44 py-1.5 text-xs"}
            placeholder="Поиск по описанию…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select aria-label="Сортировка" className={inputCls + " w-auto py-1.5 text-xs"} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="date">По дате</option>
            <option value="amount">По сумме</option>
          </select>
          <a className="inline-flex items-center rounded-xl border border-separator bg-surface px-3 py-1.5 text-xs font-medium hover:bg-background" href={exportUrl}>
            ⬇ CSV
          </a>
        </div>
      }
      subtitle={visible.length !== items.length ? `показано ${visible.length} из ${items.length} · ${formatMoney(visibleTotal)}` : undefined}
      title={`Расходы за месяц · ${items.length}`}
    >
      {cats.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Chip active={filter === ""} onClick={() => setFilter("")}>
            Все
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {iconOf(c)} {c}
            </Chip>
          ))}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Загрузка…</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-separator py-10 text-center">
          <span className="text-4xl">📭</span>
          <p className="text-sm font-medium">{items.length === 0 ? "Список пуст" : "Ничего не найдено"}</p>
          <p className="text-xs text-muted">{items.length === 0 ? "Добавьте первый расход через форму" : "Попробуйте изменить фильтр или поиск"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.date ?? "all"}>
              {g.date && (
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                  <span className="font-medium">{formatDate(g.date)}</span>
                  <span className="tabular-nums">{formatMoney(g.rows.reduce((s, r) => s + r.amount, 0))}</span>
                </div>
              )}
              <ul className="flex flex-col gap-1.5">
                {g.rows.map((e) => (
                  <li
                    key={e.id}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent bg-background px-3 py-2.5 transition hover:border-separator"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ background: colorOf(e.category) + "22" }}
                    >
                      {iconOf(e.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.description || e.category}</p>
                      <p className="truncate text-xs text-muted">
                        {e.category}
                        {sort !== "date" && ` · ${formatDate(e.date)}`}
                        {e.recipient && ` · ${e.recipient}`}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatMoney(e.amount)}</span>
                    <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                      <Button aria-label="Изменить" size="sm" variant="secondary" onClick={() => onEdit(e)}>
                        ✎
                      </Button>
                      <Button aria-label="Удалить" disabled={deleting === e.id} size="sm" variant="danger" onClick={() => handleDelete(e)}>
                        {deleting === e.id ? "…" : "✕"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
