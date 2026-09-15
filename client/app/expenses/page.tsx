"use client";

import { useMemo, useState } from "react";
import { Card, Link, ListBox, ListBoxItem, SearchField, Select, Skeleton } from "@heroui/react";

import { ExpenseTable } from "@/components/expense-table";
import { MonthNav } from "@/components/month-nav";
import { useApp } from "@/app/providers";
import { api } from "@/lib/api";
import { useSummary } from "@/lib/hooks";

type Sort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export default function ExpensesPage() {
  const { data, loading, year, month } = useSummary();
  const { money } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [rec, setRec] = useState("all");
  const [sort, setSort] = useState<Sort>("date_desc");

  const items = data?.items ?? [];
  const cats = Array.from(new Set(items.map((i) => i.category)));
  const recs = Array.from(new Set(items.map((i) => i.recipient).filter(Boolean))) as string[];

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter(
      (i) =>
        (cat === "all" || i.category === cat) &&
        (rec === "all" || i.recipient === rec) &&
        (!needle || `${i.description ?? ""} ${i.recipient ?? ""} ${i.category}`.toLowerCase().includes(needle)),
    );
    const cmp: Record<Sort, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      date_desc: (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
      date_asc: (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
      amount_desc: (a, b) => b.amount - a.amount,
      amount_asc: (a, b) => a.amount - b.amount,
    };
    return [...list].sort(cmp[sort]);
  }, [items, q, cat, rec, sort]);

  const total = visible.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <MonthNav title="Расходы" />

      <Card>
        <Card.Header className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <Card.Title>Записи</Card.Title>
            <Card.Description className="tabular-nums">
              {visible.length}
              {visible.length !== items.length && ` из ${items.length}`} · {money(total)}
            </Card.Description>
          </div>
          <Link className="text-xs" href={api.exportUrl(year, month)}>
            Скачать CSV
          </Link>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            <SearchField aria-label="Поиск" value={q} onChange={setQ}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Поиск" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <Select aria-label="Категория" selectedKey={cat} onSelectionChange={(k) => setCat(String(k))}>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="all">Все категории</ListBoxItem>
                  {cats.map((c) => (
                    <ListBoxItem key={c} id={c}>
                      {c}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <Select aria-label="На кого" isDisabled={recs.length === 0} selectedKey={rec} onSelectionChange={(k) => setRec(String(k))}>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="all">Все получатели</ListBoxItem>
                  {recs.map((r) => (
                    <ListBoxItem key={r} id={r}>
                      {r}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <Select aria-label="Сортировка" selectedKey={sort} onSelectionChange={(k) => setSort(k as Sort)}>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="date_desc">Сначала новые</ListBoxItem>
                  <ListBoxItem id="date_asc">Сначала старые</ListBoxItem>
                  <ListBoxItem id="amount_desc">По убыванию суммы</ListBoxItem>
                  <ListBoxItem id="amount_asc">По возрастанию суммы</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {loading && items.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <ExpenseTable items={visible} pageSize={12} />
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
