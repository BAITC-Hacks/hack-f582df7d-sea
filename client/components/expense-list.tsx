"use client";

import { useMemo, useState } from "react";
import { AlertDialog, Button, Card, EmptyState, Link, SearchField, Table, ToggleButton, ToggleButtonGroup } from "@heroui/react";

import { colorOf } from "@/lib/categories";
import { formatDate, formatMoney } from "@/lib/api";
import type { Expense } from "@/types";

interface Props {
  items: Expense[];
  onDelete: (id: number) => Promise<void>;
  onEdit: (e: Expense) => void;
  exportUrl: string;
}

export function ExpenseList({ items, onDelete, onEdit, exportUrl }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cats = Array.from(new Set(items.map((i) => i.category)));

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "all" || i.category === filter) &&
        (!needle || `${i.description ?? ""} ${i.recipient ?? ""} ${i.category}`.toLowerCase().includes(needle)),
    );
  }, [items, filter, q]);

  const visibleTotal = visible.reduce((s, i) => s + i.amount, 0);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await onDelete(pending.id);
      setPending(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <Card.Header className="flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <Card.Title>Записи</Card.Title>
          <Card.Description className="tabular-nums">
            {visible.length}
            {visible.length !== items.length && ` из ${items.length}`} · {formatMoney(visibleTotal)}
          </Card.Description>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchField aria-label="Поиск" className="w-48" value={q} onChange={setQ}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Поиск" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Link className="text-xs" href={exportUrl}>
            CSV
          </Link>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {cats.length > 1 && (
          <ToggleButtonGroup
            disallowEmptySelection
            aria-label="Категория"
            selectedKeys={new Set([filter])}
            selectionMode="single"
            size="sm"
            onSelectionChange={(keys) => setFilter(String(Array.from(keys)[0] ?? "all"))}
          >
            <ToggleButton id="all">Все</ToggleButton>
            {cats.map((c) => (
              <ToggleButton key={c} id={c}>
                {c}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        {visible.length === 0 ? (
          <EmptyState className="py-10">
            <p className="text-sm text-muted">{items.length === 0 ? "Список пуст" : "Ничего не найдено"}</p>
          </EmptyState>
        ) : (
          <Table.Root>
            <Table.ScrollContainer>
              <Table.Content aria-label="Расходы">
                <Table.Header>
                  <Table.Column isRowHeader>Дата</Table.Column>
                  <Table.Column>Категория</Table.Column>
                  <Table.Column>Описание</Table.Column>
                  <Table.Column>На кого</Table.Column>
                  <Table.Column className="text-right">Сумма</Table.Column>
                  <Table.Column aria-label="Действия" />
                </Table.Header>
                <Table.Body>
                  {visible.map((e) => (
                    <Table.Row key={e.id}>
                      <Table.Cell className="whitespace-nowrap tabular-nums text-muted">{formatDate(e.date)}</Table.Cell>
                      <Table.Cell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(e.category) }} />
                          {e.category}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="max-w-[240px] truncate">{e.description || <span className="text-muted">—</span>}</Table.Cell>
                      <Table.Cell className="text-muted">{e.recipient || "—"}</Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-right font-medium tabular-nums">{formatMoney(e.amount)}</Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-right">
                        <Button size="sm" variant="ghost" onPress={() => onEdit(e)}>
                          Изменить
                        </Button>
                        <Button size="sm" variant="ghost" onPress={() => setPending(e)}>
                          Удалить
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table.Root>
        )}
      </Card.Content>

      <AlertDialog isOpen={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>Удалить запись?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {pending && (
                  <p className="text-sm text-muted">
                    {pending.category} · {formatMoney(pending.amount)} · {formatDate(pending.date)}
                  </p>
                )}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="tertiary" onPress={() => setPending(null)}>
                  Отмена
                </Button>
                <Button isDisabled={deleting} variant="danger" onPress={confirmDelete}>
                  Удалить
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </Card>
  );
}
