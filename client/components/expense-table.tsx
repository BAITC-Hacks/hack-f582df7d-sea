"use client";

import { useMemo, useState } from "react";
import { AlertDialog, Button, Chip, Dropdown, EmptyState, Pagination, Table } from "@heroui/react";

import { useApp } from "@/app/providers";
import { colorOf } from "@/lib/categories";
import { formatDate } from "@/lib/api";
import type { Expense } from "@/types";

interface Props {
  items: Expense[];
  pageSize?: number;
  compact?: boolean;
}

export function ExpenseTable({ items, pageSize = 10, compact = false }: Props) {
  const { money, setEditing, deleteExpense, createExpense } = useApp();
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);

  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = useMemo(() => items.slice((safePage - 1) * pageSize, safePage * pageSize), [items, safePage, pageSize]);

  const onAction = (key: React.Key, e: Expense) => {
    if (key === "edit") setEditing(e);
    if (key === "delete") setPending(e);
    if (key === "dup") createExpense({ category: e.category, amount: e.amount, date: e.date, description: e.description, recipient: e.recipient });
  };

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteExpense(pending);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0)
    return (
      <EmptyState className="py-10">
        <p className="text-sm text-muted">Записей нет</p>
      </EmptyState>
    );

  const pageNumbers = () => {
    const set = new Set<number>([1, pages, safePage, safePage - 1, safePage + 1]);
    return Array.from(set).filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  };

  return (
    <div className="flex flex-col gap-3">
      <Table.Root>
        <Table.ScrollContainer>
          <Table.Content aria-label="Расходы">
            <Table.Header>
              <Table.Column isRowHeader>Дата</Table.Column>
              <Table.Column>Категория</Table.Column>
              {!compact && <Table.Column>Описание</Table.Column>}
              {!compact && <Table.Column>На кого</Table.Column>}
              <Table.Column className="text-right">Сумма</Table.Column>
              <Table.Column aria-label="Действия" className="w-10" />
            </Table.Header>
            <Table.Body>
              {rows.map((e) => (
                <Table.Row key={e.id}>
                  <Table.Cell className="whitespace-nowrap tabular-nums text-muted">{formatDate(e.date)}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorOf(e.category) }} />
                      {e.category}
                      {compact && e.description && <span className="text-muted">· {e.description}</span>}
                    </span>
                  </Table.Cell>
                  {!compact && <Table.Cell className="max-w-[260px] truncate">{e.description || <span className="text-muted">—</span>}</Table.Cell>}
                  {!compact && (
                    <Table.Cell>
                      {e.recipient ? (
                        <Chip size="sm" variant="soft">
                          {e.recipient}
                        </Chip>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Table.Cell>
                  )}
                  <Table.Cell className="whitespace-nowrap text-right font-medium tabular-nums">{money(e.amount)}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Dropdown>
                      <Dropdown.Trigger aria-label="Действия" className="button button--ghost button--sm button--icon-only">
                        ⋯
                      </Dropdown.Trigger>
                      <Dropdown.Popover placement="bottom end">
                        <Dropdown.Menu onAction={(k) => onAction(k, e)}>
                          <Dropdown.Item id="edit">Изменить</Dropdown.Item>
                          <Dropdown.Item id="dup">Дублировать</Dropdown.Item>
                          <Dropdown.Item id="delete" variant="danger">
                            Удалить
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table.Root>

      {pages > 1 && (
        <Pagination className="justify-end" size="sm">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous isDisabled={safePage === 1} onPress={() => setPage(safePage - 1)}>
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            {pageNumbers().map((p, i, arr) => (
              <Pagination.Item key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && <Pagination.Ellipsis />}
                <Pagination.Link isActive={p === safePage} onPress={() => setPage(p)}>
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next isDisabled={safePage === pages} onPress={() => setPage(safePage + 1)}>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      )}

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
                    {pending.category} · {money(pending.amount)} · {formatDate(pending.date)}
                  </p>
                )}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="tertiary" onPress={() => setPending(null)}>
                  Отмена
                </Button>
                <Button isDisabled={busy} variant="danger" onPress={confirm}>
                  Удалить
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
