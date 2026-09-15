"use client";

import { colorOf } from "@/lib/categories";
import { compact } from "@/lib/api";
import type { CategorySummary } from "@/types";

export function Donut({ data, total, size = 160 }: { data: CategorySummary[]; total: number; size?: number }) {
  const r = 46;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg className="shrink-0" height={size} viewBox="0 0 120 120" width={size}>
      <circle cx="60" cy="60" fill="none" r={r} stroke="currentColor" strokeOpacity="0.06" strokeWidth="12" />
      {total > 0 &&
        data.map((c) => {
          const len = (c.total_amount / total) * C;
          const gap = data.length > 1 ? 1.5 : 0;
          const dash = Math.max(len - gap, 0);
          const el = (
            <circle
              key={c.category}
              cx="60"
              cy="60"
              fill="none"
              r={r}
              stroke={colorOf(c.category)}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              strokeWidth="12"
              transform="rotate(-90 60 60)"
            >
              <title>{`${c.category} ${c.percentage}%`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      <text className="fill-current text-[12px] font-semibold" textAnchor="middle" x="60" y="64">
        {compact(total)}
      </text>
    </svg>
  );
}
