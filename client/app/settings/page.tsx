"use client";

import { useEffect, useState } from "react";
import { AlertDialog, Button, Card, Chip, ToggleButton, ToggleButtonGroup, toast } from "@heroui/react";
import { useTheme } from "next-themes";

import { useApp } from "@/app/providers";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { refresh } = useApp();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [health, setHealth] = useState<{ status: string; count: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setMounted(true);
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      refresh();
      api.health().then(setHealth).catch(() => {});
      toast.success(msg);
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const exportJson = async () => {
    const items = await api.list();
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expenses.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="pb-2">
        <p className="text-xs text-muted">Настройки</p>
        <h1 className="text-2xl font-semibold tracking-tight">Tiyn</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Внешний вид</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-2">
              <span className="text-sm">Тема</span>
              {mounted && (
                <ToggleButtonGroup aria-label="Тема" disallowEmptySelection selectedKeys={new Set([theme ?? "system"])} selectionMode="single" size="sm" onSelectionChange={(k) => setTheme(String(Array.from(k)[0]))}>
                  <ToggleButton id="light">Светлая</ToggleButton>
                  <ToggleButton id="dark">Тёмная</ToggleButton>
                  <ToggleButton id="system">Системная</ToggleButton>
                </ToggleButtonGroup>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title>Данные</Card.Title>
            {health ? (
              <Chip color="success" size="sm" variant="soft">
                сервер · {health.count} записей
              </Chip>
            ) : (
              <Chip color="danger" size="sm" variant="soft">
                сервер недоступен
              </Chip>
            )}
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            <Row title="Проверочный пример" text="Три записи: еда 1500, транспорт 600, еда 900. Заменяет все данные.">
              <Button size="sm" variant="secondary" onPress={() => run(() => api.seed(false), "Пример загружен")}>
                Загрузить
              </Button>
            </Row>
            <Row title="Демо-данные" text="Проверочный пример плюс несколько месяцев случайных трат и бюджеты.">
              <Button size="sm" variant="secondary" onPress={() => run(() => api.seed(true), "Демо-данные загружены")}>
                Загрузить
              </Button>
            </Row>
            <Row title="Экспорт" text="Все записи в JSON.">
              <Button size="sm" variant="secondary" onPress={exportJson}>
                Скачать
              </Button>
            </Row>
            <Row title="Удалить всё" text="Все расходы за все месяцы. Необратимо.">
              <Button size="sm" variant="danger-soft" onPress={() => setConfirmClear(true)}>
                Удалить
              </Button>
            </Row>
          </Card.Content>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Горячие клавиши</Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="flex flex-col gap-1.5 text-sm text-muted">
              <li>
                <kbd className="rounded border border-separator px-1.5 text-xs text-foreground">N</kbd> — новый расход
              </li>
              <li>
                <kbd className="rounded border border-separator px-1.5 text-xs text-foreground">Esc</kbd> — закрыть окно
              </li>
            </ul>
          </Card.Content>
        </Card>
      </div>

      <AlertDialog isOpen={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>Удалить все расходы?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-muted">Будут удалены все записи за все месяцы. Лимиты бюджета останутся.</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="tertiary" onPress={() => setConfirmClear(false)}>
                  Отмена
                </Button>
                <Button
                  variant="danger"
                  onPress={async () => {
                    await run(() => api.clear(), "Все записи удалены");
                    setConfirmClear(false);
                  }}
                >
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

function Row({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-default-soft/50 px-3 py-2.5">
      <div>
        <p className="text-sm">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
      {children}
    </div>
  );
}
