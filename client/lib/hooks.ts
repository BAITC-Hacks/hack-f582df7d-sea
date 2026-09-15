"use client";

import type { Budget, Category, Expense, Summary } from "@/types";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { useApp } from "@/app/providers";

export function useSummary() {
  const { ym, version } = useApp();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, month] = ym.split("-").map(Number);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .summary(year, month)
      .then((s) => alive && (setData(s), setError(null)))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [year, month, version]);

  return { data, error, loading, year, month };
}

export function useYear(year: number) {
  const { version } = useApp();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .list({ year })
      .then((r) => alive && setItems(r))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [year, version]);
  return { items, loading };
}

export function useCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    api.categories().then(setCats).catch(() => setCats([]));
  }, []);
  return cats;
}

export function useBudgets() {
  const { version } = useApp();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  useEffect(() => {
    api.budgets().then(setBudgets).catch(() => setBudgets([]));
  }, [version]);
  return budgets;
}
