"use client";

import { useEffect, useState } from "react";
import { AlertDialog, Button, Card, Chip, Kbd, Separator, ToggleButton, ToggleButtonGroup, toast } from "@heroui/react";
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
    a.download = "tiyn.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        {health ? (
          <Chip color="success" size="sm" variant="soft">
            {health.count} записей
          </Chip>
        ) : (
          <Chip color="danger" size="sm" variant="soft">
            сервер недоступен
          </Chip>
        )}
      </div>

      <Card>
        <Card.Content className="flex flex-col gap-1 p-2">
          <Row title="Тема">
            {mounted && (
              <ToggleButtonGroup aria-label="Тема" disallowEmptySelection selectedKeys={new Set([theme ?? "system"])} selectionMode="single" size="sm" onSelectionChange={(k) => setTheme(String(Array.from(k)[0]))}>
                <ToggleButton id="light">Светлая</ToggleButton>
                <ToggleButton id="dark">Тёмная</ToggleButton>
                <ToggleButton id="system">Авто</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Row>
          <Row title="Новый расход">
            <Kbd>
              <Kbd.Content>N</Kbd.Content>
            </Kbd>
          </Row>
          <Separator className="my-1" />
          <Row text="Еда 1500, транспорт 600, еда 900. Заменяет все данные." title="Проверочный пример">
            <Button size="sm" variant="secondary" onPress={() => run(() => api.seed(false), "Пример загружен")}>
              Загрузить
            </Button>
          </Row>
          <Row text="Пример плюс несколько месяцев трат и лимиты." title="Демо-данные">
            <Button size="sm" variant="secondary" onPress={() => run(() => api.seed(true), "Демо-данные загружены")}>
              Загрузить
            </Button>
          </Row>
          <Row text="Все записи в JSON." title="Экспорт">
            <Button size="sm" variant="secondary" onPress={exportJson}>
              Скачать
            </Button>
          </Row>
          <Separator className="my-1" />
          <Row text="Все расходы за все месяцы. Необратимо." title="Удалить всё">
            <Button size="sm" variant="danger-soft" onPress={() => setConfirmClear(true)}>
              Удалить
            </Button>
          </Row>
        </Card.Content>
      </Card>

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

function Row({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <div>
        <p className="text-sm">{title}</p>
        {text && <p className="text-xs text-muted">{text}</p>}
      </div>
      {children}
    </div>
  );
}
