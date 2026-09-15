"use client";

import type { ThemeProviderProps } from "next-themes";
import type { Expense, ExpenseInput } from "@/types";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ThemeProvider } from "next-themes";
import { ToastProvider, toast } from "@heroui/react";

import { api, currentYm, formatNumber } from "@/lib/api";

interface AppState {
  ym: string;
  setYm: (ym: string) => void;
  version: number;
  refresh: () => void;
  money: (n: number) => string;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  editing: Expense | null;
  setEditing: (e: Expense | null) => void;
  createExpense: (data: ExpenseInput) => Promise<void>;
  updateExpense: (id: number, data: ExpenseInput) => Promise<void>;
  deleteExpense: (e: Expense) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
};

export function Providers({ children, themeProps }: { children: React.ReactNode; themeProps?: ThemeProviderProps }) {
  const [ym, setYm] = useState(currentYm);
  const [version, setVersion] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const money = useCallback((n: number) => `${formatNumber(n)} ₸`, []);

  const createExpense = useCallback(
    async (data: ExpenseInput) => {
      await api.create(data);
      setYm(data.date.slice(0, 7));
      refresh();
      toast.success("Расход добавлен", { description: `${data.category} · ${money(data.amount)}` });
    },
    [money, refresh],
  );

  const updateExpense = useCallback(
    async (id: number, data: ExpenseInput) => {
      await api.update(id, data);
      setYm(data.date.slice(0, 7));
      refresh();
      toast.success("Сохранено");
    },
    [refresh],
  );

  const deleteExpense = useCallback(
    async (e: Expense) => {
      await api.remove(e.id);
      refresh();
      toast("Расход удалён", {
        description: `${e.category} · ${money(e.amount)}`,
        actionProps: {
          children: "Отменить",
          onPress: async () => {
            await api.create({ category: e.category, amount: e.amount, date: e.date, description: e.description, recipient: e.recipient });
            refresh();
          },
        },
      });
    },
    [money, refresh],
  );

  const value = useMemo<AppState>(
    () => ({ ym, setYm, version, refresh, money, addOpen, setAddOpen, editing, setEditing, createExpense, updateExpense, deleteExpense }),
    [ym, version, refresh, money, addOpen, editing, createExpense, updateExpense, deleteExpense],
  );

  return (
    <ThemeProvider {...themeProps}>
      <Ctx.Provider value={value}>
        {children}
        <ToastProvider placement="bottom end" />
      </Ctx.Provider>
    </ThemeProvider>
  );
}
