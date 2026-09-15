"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

import { Button, inputCls, iconOf } from "@/components/ui";
import type { Category, Expense, ExpenseInput } from "@/types";

interface Props {
  categories: Category[];
  defaultDate: string;
  initial?: Expense | null; // режим редактирования
  submitLabel?: string;
  onSubmit: (data: ExpenseInput) => Promise<void>;
  onCancel?: () => void;
}

type Errors = Partial<Record<"amount" | "category" | "date", string>>;

const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1.5 text-sm">
    <span className="font-medium">{label}</span>
    {children}
    {error ? <span className="text-xs text-danger">{error}</span> : hint ? <span className="text-xs text-muted">{hint}</span> : null}
  </label>
);

const QUICK_AMOUNTS = [500, 1000, 1500, 2000, 5000];
const RECIPIENTS = ["я", "друзья", "семья", "подарок"];

export function ExpenseForm({ categories, defaultDate, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!initial && !date) setDate(defaultDate);
  }, [defaultDate, initial, date]);

  const validate = (): Errors => {
    const e: Errors = {};
    const normalized = amount.replace(",", ".").replace(/\s/g, "").trim();
    const num = Number(normalized);
    if (!normalized) e.amount = "Введите сумму";
    else if (!Number.isFinite(num)) e.amount = "Сумма должна быть числом";
    else if (num <= 0) e.amount = "Сумма должна быть больше 0";
    else if (num > 1_000_000_000) e.amount = "Слишком большая сумма";
    if (!category) e.category = "Выберите категорию";
    if (!date) e.date = "Укажите дату";
    else if (Number.isNaN(new Date(date).getTime())) e.date = "Некорректная дата";
    else if (new Date(date) > new Date(Date.now() + 366 * 864e5)) e.date = "Дата слишком далеко в будущем";
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
        amount: Math.round(Number(amount.replace(",", ".").replace(/\s/g, "")) * 100) / 100,
        category,
        date,
        description: description.trim() || null,
        recipient: recipient.trim() || null,
      });
      if (!initial) {
        setAmount("");
        setDescription("");
        setOk(true);
        setTimeout(() => setOk(false), 2000);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Не удалось сохранить расход");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      <Field error={errors.amount} label="Сумма, ₸ *">
        <div className="relative">
          <input
            autoFocus
            className={clsx(inputCls, "pr-8 text-lg font-semibold", errors.amount && "border-danger")}
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">₸</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              className="cursor-pointer rounded-lg bg-background px-2 py-1 text-xs text-muted transition hover:bg-accent/10 hover:text-accent"
              type="button"
              onClick={() => setAmount(String(q))}
            >
              {q.toLocaleString("ru-RU")}
            </button>
          ))}
        </div>
      </Field>

      <Field error={errors.category} label="Категория *">
        <div className="grid grid-cols-4 gap-1.5">
          {categories.map((c) => (
            <button
              key={c.key}
              className={clsx(
                "flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-[11px] leading-tight transition",
                category === c.name
                  ? "border-accent bg-accent/10 font-semibold text-accent"
                  : "border-separator bg-background text-muted hover:border-accent/40 hover:text-foreground",
                errors.category && !category && "border-danger/50",
              )}
              type="button"
              onClick={() => setCategory(c.name)}
            >
              <span className="text-lg">{iconOf(c.name)}</span>
              {c.name}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field error={errors.date} label="Дата *">
          <input
            className={clsx(inputCls, errors.date && "border-danger")}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field hint="необязательно" label="На кого потратили">
          <input
            className={inputCls}
            list="recipients"
            maxLength={100}
            placeholder="я / друзья / семья"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <datalist id="recipients">
            {RECIPIENTS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field hint="необязательно" label="Описание">
        <input
          className={inputCls}
          maxLength={200}
          placeholder="Обед в столовой"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {serverError && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>}
      {ok && <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">Расход добавлен ✓</p>}

      <div className="flex gap-2">
        <Button className="flex-1" disabled={busy} size="lg" type="submit">
          {busy ? "Сохраняем…" : (submitLabel ?? "Добавить расход")}
        </Button>
        {onCancel && (
          <Button size="lg" type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
