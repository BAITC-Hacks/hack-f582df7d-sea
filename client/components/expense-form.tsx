"use client";

import { useState } from "react";
import { Button, FieldError, Form, Input, Label, ListBox, ListBoxItem, Select, TextField } from "@heroui/react";

import type { Category, Expense, ExpenseInput } from "@/types";

interface Props {
  categories: Category[];
  defaultDate: string;
  initial?: Expense | null;
  submitLabel?: string;
  onSubmit: (data: ExpenseInput) => Promise<void>;
  onCancel?: () => void;
}

type Errors = Partial<Record<"amount" | "category" | "date", string>>;

const parseAmount = (s: string) => Number(s.replace(",", ".").replace(/\s/g, ""));

export function ExpenseForm({ categories, defaultDate, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    const num = parseAmount(amount);
    if (!amount.trim()) e.amount = "Введите сумму";
    else if (!Number.isFinite(num)) e.amount = "Сумма должна быть числом";
    else if (num <= 0) e.amount = "Сумма должна быть больше 0";
    if (!category) e.category = "Выберите категорию";
    if (!date) e.date = "Укажите дату";
    else if (Number.isNaN(new Date(date).getTime())) e.date = "Некорректная дата";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await onSubmit({
        amount: Math.round(parseAmount(amount) * 100) / 100,
        category,
        date,
        description: description.trim() || null,
        recipient: recipient.trim() || null,
      });
      if (!initial) {
        setAmount("");
        setDescription("");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Form className="flex flex-col gap-4" validationBehavior="aria" onSubmit={handleSubmit}>
      <TextField fullWidth isRequired isInvalid={!!errors.amount} value={amount} onChange={setAmount}>
        <Label>Сумма</Label>
        <Input autoFocus inputMode="decimal" placeholder="0" />
        <FieldError>{errors.amount}</FieldError>
      </TextField>

      <Select
        fullWidth
        isRequired
        isInvalid={!!errors.category}
        placeholder="Выберите"
        selectedKey={category || null}
        onSelectionChange={(k) => setCategory(k ? String(k) : "")}
      >
        <Label>Категория</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <FieldError>{errors.category}</FieldError>
        <Select.Popover>
          <ListBox>
            {categories.map((c) => (
              <ListBoxItem key={c.name} id={c.name} textValue={c.name}>
                {c.name}
              </ListBoxItem>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField fullWidth isRequired isInvalid={!!errors.date} value={date} onChange={setDate}>
          <Label>Дата</Label>
          <Input type="date" />
          <FieldError>{errors.date}</FieldError>
        </TextField>
        <TextField fullWidth value={recipient} onChange={setRecipient}>
          <Label>На кого</Label>
          <Input maxLength={100} placeholder="необязательно" />
        </TextField>
      </div>

      <TextField fullWidth value={description} onChange={setDescription}>
        <Label>Описание</Label>
        <Input maxLength={200} placeholder="необязательно" />
      </TextField>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <div className="flex gap-2 pt-1">
        <Button fullWidth isDisabled={busy} type="submit" variant="primary">
          {submitLabel ?? "Добавить"}
        </Button>
        {onCancel && (
          <Button variant="tertiary" onPress={onCancel}>
            Отмена
          </Button>
        )}
      </div>
    </Form>
  );
}
