"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { Button, Kbd, Modal, Tooltip } from "@heroui/react";
import clsx from "clsx";

import { ExpenseForm } from "@/components/expense-form";
import { useApp } from "@/app/providers";
import { useCategories } from "@/lib/hooks";
import { currentYm, todayIso } from "@/lib/api";

const NAV = [
  { href: "/", label: "Обзор" },
  { href: "/expenses", label: "Расходы" },
  { href: "/analytics", label: "Аналитика" },
  { href: "/budget", label: "Бюджет" },
  { href: "/settings", label: "Настройки" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ym, addOpen, setAddOpen, editing, setEditing, createExpense, updateExpense } = useApp();
  const categories = useCategories();
  const defaultDate = ym === currentYm() ? todayIso() : `${ym}-01`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "n" || e.key === "т") {
        e.preventDefault();
        setAddOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setAddOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-separator bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-6 px-4 sm:px-6">
          <NextLink className="text-sm font-semibold tracking-tight" href="/">
            Tiyn
          </NextLink>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NextLink
                key={n.href}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm transition",
                  pathname === n.href ? "bg-default-soft text-foreground" : "text-muted hover:text-foreground",
                )}
                href={n.href}
              >
                {n.label}
              </NextLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <Tooltip.Trigger>
                <Button size="sm" variant="primary" onPress={() => setAddOpen(true)}>
                  Добавить
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <span className="flex items-center gap-2">
                  Новый расход
                  <Kbd>
                    <Kbd.Content>N</Kbd.Content>
                  </Kbd>
                </span>
              </Tooltip.Content>
            </Tooltip>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map((n) => (
            <NextLink
              key={n.href}
              className={clsx("whitespace-nowrap rounded-md px-3 py-1 text-sm", pathname === n.href ? "bg-default-soft" : "text-muted")}
              href={n.href}
            >
              {n.label}
            </NextLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6">{children}</main>

      <Modal isOpen={addOpen} onOpenChange={setAddOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Новый расход</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <ExpenseForm
                  categories={categories}
                  defaultDate={defaultDate}
                  onCancel={() => setAddOpen(false)}
                  onSubmit={async (d) => {
                    await createExpense(d);
                    setAddOpen(false);
                  }}
                />
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
                    onSubmit={async (d) => {
                      await updateExpense(editing.id, d);
                      setEditing(null);
                    }}
                  />
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
