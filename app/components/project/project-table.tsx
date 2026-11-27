"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ArrowUpRight } from "lucide-react";

import { setProjectGroup, updateProjectField } from "@/app/actions";
import { DeleteProjectButton } from "@/app/components/project/delete-project-button";
import type { Profile, ProjectGroup, ProjectRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

const inputBase =
  "rounded-md bg-transparent px-2 outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus";
const textClass = `field-sizing-content min-h-8 w-full resize-none py-1 ${inputBase}`;
const selectClass = `h-8 w-full ${inputBase}`;
const dateClass = `h-8 w-full ${inputBase}`;

function onEnterBlur(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

function TextCell({
  value,
  required,
  onSave,
}: {
  value: string;
  required?: boolean;
  onSave: (value: string) => void;
}) {
  return (
    <textarea
      key={value}
      defaultValue={value}
      rows={1}
      className={textClass}
      onKeyDown={onEnterBlur}
      onBlur={(e) => {
        const next = e.target.value.trim();
        if (required && !next) {
          e.target.value = value;
          return;
        }
        if (next !== value) onSave(next);
      }}
    />
  );
}

function SelectCell({
  value,
  options,
  placeholder,
  onSave,
}: {
  value: string;
  options: Option[];
  /** Jika diisi, ada opsi kosong dengan label ini. */
  placeholder?: string;
  onSave: (value: string) => void;
}) {
  return (
    <select
      key={value}
      defaultValue={value}
      className={selectClass}
      onChange={(e) => onSave(e.target.value)}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function DateCell({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  return (
    <input
      key={value}
      type="date"
      defaultValue={value}
      className={dateClass}
      onChange={(e) => onSave(e.target.value)}
    />
  );
}

function MonthCell({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  return (
    <input
      key={value}
      type="month"
      defaultValue={value}
      className={dateClass}
      onChange={(e) => e.target.value && onSave(e.target.value)}
    />
  );
}

/** Pastikan nilai yang sudah tersimpan tetap muncul walau sudah tidak ada di daftar pilihan. */
function toOptions(values: readonly string[], current: string): Option[] {
  const list = current && !values.includes(current) ? [current, ...values] : [...values];
  return list.map((v) => ({ value: v, label: v }));
}

type SortKey =
  | "name" | "group" | "periode" | "pilar" | "jenis" | "tema" | "akun" | "keyword"
  | "hook" | "cta" | "prod_date" | "editor_date" | "selesai_date" | "pic"
  | "upload_date" | "status";

type Sort = { key: SortKey; dir: "asc" | "desc" } | null;

/** Kolom tanpa `key` tidak bisa di-sort. */
const headers: { label: string; key?: SortKey }[] = [
  { label: "NO" },
  { label: "Judul Konten", key: "name" },
  { label: "Group", key: "group" },
  { label: "Bulan", key: "periode" },
  { label: "Pilar Konten", key: "pilar" },
  { label: "Jenis Konten", key: "jenis" },
  { label: "Tema", key: "tema" },
  { label: "Akun", key: "akun" },
  { label: "Fokus Keyword", key: "keyword" },
  { label: "HOOK", key: "hook" },
  { label: "CTA", key: "cta" },
  { label: "Tgl Produksi", key: "prod_date" },
  { label: "Tgl Masuk Editor", key: "editor_date" },
  { label: "Tgl Selesai", key: "selesai_date" },
  { label: "PIC", key: "pic" },
  { label: "Tgl Upload", key: "upload_date" },
  { label: "Status", key: "status" },
];

const collator = new Intl.Collator("id", { numeric: true, sensitivity: "base" });

/** Nilai kosong selalu di bawah, baik urutan naik maupun turun. */
function compareValues(a: string, b: string, dir: "asc" | "desc") {
  if (!a || !b) return a ? -1 : b ? 1 : 0;
  return dir === "asc" ? collator.compare(a, b) : collator.compare(b, a);
}

const cellW = "px-2 py-1.5";

export function ProjectTable({
  rows,
  groups,
  profiles,
  pilarOptions,
  accountOptions,
  statusValues,
  jenisValues,
  statusClasses,
}: {
  rows: ProjectRow[];
  groups: ProjectGroup[];
  profiles: Profile[];
  pilarOptions: string[];
  accountOptions: string[];
  statusValues: string[];
  jenisValues: string[];
  statusClasses: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();

  const save = (id: string, field: string, value: string) =>
    startTransition(() => updateProjectField(id, field, value));

  const groupOptions: Option[] = groups.map((g) => ({ value: g.id, label: g.name || "Tanpa nama" }));
  const picOptions: Option[] = profiles.map((p) => ({
    value: p.id,
    label: p.full_name || p.email,
  }));

  const [sort, setSort] = useState<Sort>(null);

  // Klik berulang: naik -> turun -> urutan asli.
  const toggleSort = (key: SortKey) =>
    setSort((current) => {
      if (current?.key !== key) return { key, dir: "asc" };
      return current.dir === "asc" ? { key, dir: "desc" } : null;
    });

  /** Teks yang dibandingkan untuk satu sel. */
  const sortValue = (row: ProjectRow, key: SortKey): string => {
    switch (key) {
      case "group":
        return groupOptions.find((g) => g.value === row.group_id)?.label ?? "";
      case "pic":
        return row.pic_name || row.pic_email || "";
      case "status": {
        // Ikut urutan status di halaman Admin, bukan abjad.
        const i = statusValues.indexOf(row.status);
        return String(i < 0 ? statusValues.length : i);
      }
      default:
        return row[key] ?? "";
    }
  };

  const sortedRows = sort
    ? [...rows].sort((a, b) =>
        compareValues(sortValue(a, sort.key), sortValue(b, sort.key), sort.dir),
      )
    : rows;

  return (
    <div className="space-y-2 w-full">
      <p className="h-4 text-xs text-muted">
        {pending ? "Menyimpan..." : "Klik sel untuk mengedit. Auto Save."}
      </p>

      <div className="max-h-[calc(140vh-13rem)] overflow-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[110rem] border-collapse text-sm">
          <thead className="text-left">
            <tr>
              {headers.map(({ label, key }) => {
                const dir = key && sort?.key === key ? sort.dir : null;
                const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
                return (
                  <th
                    key={label}
                    aria-sort={dir ? (dir === "asc" ? "ascending" : "descending") : undefined}
                    className="sticky top-0 z-10 bg-default px-3 py-2.5 font-semibold shadow-[0_1px_0_0_var(--border)]"
                  >
                    {key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {label}
                        <Icon
                          aria-hidden="true"
                          className={cn("size-3.5 shrink-0", !dir && "opacity-40")}
                        />
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                );
              })}
              <th className="sticky top-0 z-10 w-20 bg-default shadow-[0_1px_0_0_var(--border)]" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="px-4 py-6 text-center text-muted">
                  Belum ada konten.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border align-top last:border-b-0",
                    statusClasses[row.status],
                  )}
                >
                  <td className="px-3 py-2.5 tabular-nums">{index + 1}</td>

                  <td className={cn(cellW, "min-w-56")}>
                    <TextCell
                      required
                      value={row.name}
                      onSave={(v) => save(row.id, "name", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <SelectCell
                      value={row.group_id ?? ""}
                      placeholder="Tanpa group"
                      options={groupOptions}
                      onSave={(v) => startTransition(() => setProjectGroup(row.id, v))}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <MonthCell
                      value={row.periode ?? ""}
                      onSave={(v) => save(row.id, "periode", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-40")}>
                    <SelectCell
                      value={row.pilar ?? ""}
                      placeholder="Pilih pilar"
                      options={toOptions(pilarOptions, row.pilar ?? "")}
                      onSave={(v) => v && save(row.id, "pilar", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <SelectCell
                      value={row.jenis ?? ""}
                      placeholder="Pilih jenis"
                      options={toOptions(jenisValues, row.jenis ?? "")}
                      onSave={(v) => save(row.id, "jenis", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-32")}>
                    <TextCell value={row.tema ?? ""} onSave={(v) => save(row.id, "tema", v)} />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <SelectCell
                      value={row.akun ?? ""}
                      placeholder="Pilih akun"
                      options={toOptions(accountOptions, row.akun ?? "")}
                      onSave={(v) => v && save(row.id, "akun", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <TextCell
                      value={row.keyword ?? ""}
                      onSave={(v) => save(row.id, "keyword", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-56")}>
                    <TextCell value={row.hook ?? ""} onSave={(v) => save(row.id, "hook", v)} />
                  </td>

                  <td className={cn(cellW, "min-w-56")}>
                    <TextCell value={row.cta ?? ""} onSave={(v) => save(row.id, "cta", v)} />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <DateCell
                      value={row.prod_date ?? ""}
                      onSave={(v) => save(row.id, "prod_date", v)}
                    />
                  </td>
                  <td className={cn(cellW, "min-w-36")}>
                    <DateCell
                      value={row.editor_date ?? ""}
                      onSave={(v) => save(row.id, "editor_date", v)}
                    />
                  </td>
                  <td className={cn(cellW, "min-w-36")}>
                    <DateCell
                      value={row.selesai_date ?? ""}
                      onSave={(v) => save(row.id, "selesai_date", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <SelectCell
                      value={row.pic_id ?? ""}
                      placeholder="Belum ditentukan"
                      options={picOptions}
                      onSave={(v) => save(row.id, "pic_id", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-36")}>
                    <DateCell
                      value={row.upload_date ?? ""}
                      onSave={(v) => save(row.id, "upload_date", v)}
                    />
                  </td>

                  <td className={cn(cellW, "min-w-28")}>
                    <SelectCell
                      value={row.status}
                      options={toOptions(statusValues, row.status)}
                      onSave={(v) => save(row.id, "status", v)}
                    />
                  </td>

                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/projects/${row.slug}`}
                        aria-label="Buka project"
                        title="Buka project"
                        className="rounded-md p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                      <DeleteProjectButton id={row.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}