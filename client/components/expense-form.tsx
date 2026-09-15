"use client";

import { useState } from "react";
import clsx from "clsx";

import { Button, Card, inputCls } from "@/components/ui";
import type { Category, Expense } from "@/types";

interface Props {
  categories: Category[];
  defaultDate: string; // YYYY-MM-DD
  onSubmit: (data: Omit<Expense, "id">) => Promise<void>;
}

type Errors = Partial<Record<"amount" | "category" | "date", string>>;

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-medium">{label}</span>
    {children}
    {error && <span className="text-xs text-danger">{error}</span>}
  </label>
);

export function ExpenseForm({ categories, defaultDate, onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    const normalized = amount.replace(",", ".").trim();
    const num = Number(normalized);
    if (!normalized) e.amount = "Введите сумму";
    else if (!Number.isFinite(num)) e.amount = "Сумма должна быть числом";
    else if (num <= 0) e.amount = "Сумма должна быть больше 0";
    else if (num > 1_000_000_000) e.amount = "Слишком большая сумма";
    if (!category) e.category = "Выберите категорию";
    if (!date) e.date = "Укажите дату";
    else if (Number.isNaN(new Date(date).getTime())) e.date = "Некорректная дата";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    setOk(false);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await onSubmit({
        amount: Math.round(Number(amount.replace(",", ".")) * 100) / 100,
        category,
        date,
        description: description.trim() || null,
      });
      setAmount("");
      setDescription("");
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Не удалось сохранить расход");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Добавить расход">
      <form className="flex flex-col gap-3" noValidate onSubmit={handleSubmit}>
        <Field error={errors.amount} label="Сумма, ₸ *">
          <input
            className={clsx(inputCls, errors.amount && "border-danger")}
            inputMode="decimal"
            placeholder="Например, 1500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field error={errors.category} label="Категория *">
          <select
            className={clsx(inputCls, errors.category && "border-danger")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">— выберите —</option>
            {categories.map((c) => (
              <option key={c.key} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field error={errors.date} label="Дата *">
          <input
            className={clsx(inputCls, errors.date && "border-danger")}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Описание (необязательно)">
          <input
            className={inputCls}
            maxLength={200}
            placeholder="Обед в столовой"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {serverError && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>
        )}
        {ok && <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">Расход добавлен ✓</p>}

        <Button disabled={busy} type="submit">
          {busy ? "Сохраняем…" : "Добавить"}
        </Button>
      </form>
    </Card>
  );
}
