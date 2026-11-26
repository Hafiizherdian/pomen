"use client";

import { useTransition } from "react";
import { setProjectFilter } from "@/app/actions";
import { FILTER_NONE } from "@/lib/project-filter";
import { cn } from "@/lib/utils";

const selectClass =
  "h-8 max-w-44 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-focus disabled:opacity-50";

/** Border penanda filter yang sedang aktif. Ganti warnanya di sini. */
const activeClass = "border-blue-500 ring-1 ring-blue-500";

type Option = { value: string; label: string };

function FilterSelect({
  name,
  value,
  options,
  label,
  allLabel,
  noneLabel,
}: {
  name: "pic" | "jenis";
  value: string;
  options: Option[];
  label: string;
  allLabel: string;
  noneLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  // Nilai di cookie yang sudah dihapus tetap ditampilkan supaya bisa direset.
  const missing = value && value !== FILTER_NONE && !options.some((o) => o.value === value);

  return (
    <select
      key={value}
      defaultValue={value}
      disabled={pending}
      aria-busy={pending}
      aria-label={label}
      className={cn(selectClass, value && activeClass)}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => setProjectFilter(name, next));
      }}
    >
      <option value="">{allLabel}</option>
      {missing && <option value={value}>(tidak ditemukan)</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      <option value={FILTER_NONE}>{noneLabel}</option>
    </select>
  );
}

export function ProjectFilters({
  pic,
  jenis,
  profiles,
  jenisOptions,
}: {
  pic: string;
  jenis: string;
  profiles: { id: string; email: string; full_name: string | null }[];
  jenisOptions: string[];
}) {
  return (
    <>
      <FilterSelect
        name="pic"
        value={pic}
        options={profiles.map((p) => ({ value: p.id, label: p.full_name || p.email }))}
        label="Filter PIC"
        allLabel="Semua PIC"
        noneLabel="Tanpa PIC"
      />
      <FilterSelect
        name="jenis"
        value={jenis}
        options={jenisOptions.map((v) => ({ value: v, label: v }))}
        label="Filter jenis konten"
        allLabel="Semua jenis"
        noneLabel="Tanpa jenis"
      />
    </>
  );
}