"use client";

import { useTransition } from "react";
import { setPeriodeFilter } from "@/app/actions";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const selectClass =
  "h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-focus disabled:opacity-50";

/** Border penanda filter yang sedang aktif. Ganti warnanya di sini. */
const activeClass = "border-blue-500 ring-1 ring-blue-500";

export function PeriodeFilter({ value, years }: { value: string; years: string[] }) {
  const [pending, startTransition] = useTransition();
  const [year = "", month = ""] = value.split("-");
  const yearList = year && !years.includes(year) ? [year, ...years].sort().reverse() : years;

  const apply = (y: string, m: string) =>
    startTransition(() => setPeriodeFilter(y ? (m ? `${y}-${m}` : y) : ""));

  return (
    <div className="flex items-center gap-2" aria-busy={pending}>
      <select
        key={`y:${value}`}
        defaultValue={year}
        disabled={pending}
        aria-label="Filter tahun"
        className={cn(selectClass, year && activeClass)}
        onChange={(e) => apply(e.target.value, e.target.value ? month : "")}
      >
        <option value="">Semua tahun</option>
        {yearList.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        key={`m:${value}`}
        defaultValue={month}
        disabled={pending || !year}
        aria-label="Filter bulan"
        className={cn(selectClass, month && activeClass)}
        onChange={(e) => apply(year, e.target.value)}
      >
        <option value="">Semua bulan</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={String(i + 1).padStart(2, "0")}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}