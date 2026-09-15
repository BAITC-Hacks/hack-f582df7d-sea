"use client";

import { Button } from "@heroui/react";

import { useApp } from "@/app/providers";
import { MONTHS, currentYm, pad } from "@/lib/api";

export function MonthNav({ title }: { title?: string }) {
  const { ym, setYm } = useApp();
  const [year, month] = ym.split("-").map(Number);
  const shift = (d: number) => {
    const x = new Date(year, month - 1 + d, 1);
    setYm(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`);
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
      <div>
        {title && <p className="text-xs text-muted">{title}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">
          {MONTHS[month - 1]} {year}
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <Button isIconOnly aria-label="Назад" size="sm" variant="tertiary" onPress={() => shift(-1)}>
          ‹
        </Button>
        <Button isIconOnly aria-label="Вперёд" size="sm" variant="tertiary" onPress={() => shift(1)}>
          ›
        </Button>
        {ym !== currentYm() && (
          <Button size="sm" variant="ghost" onPress={() => setYm(currentYm())}>
            Сегодня
          </Button>
        )}
      </div>
    </div>
  );
}
