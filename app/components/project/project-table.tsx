"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowUpRight } from "lucide-react";

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

const headers = [
  "NO",
  "Judul Konten",
  "Group",
  "Bulan",
  "Pilar Konten",
  "Jenis Konten",
  "Tema",
  "Akun",
  "Fokus Keyword",
  "HOOK",
  "CTA",
  "Tgl Produksi",
  "Tgl Masuk Editor",
  "Tgl Selesai",
  "PIC",
  "Tgl Upload",
  "Status",
];

const cellW = "px-2 py-1.5";

export function ProjectTable({
  rows,
  groups,
  profiles,
  pilarOptions,
  accountOptions,
  statusValues,
  jenisValues,
  doneStatuses,
}: {
  rows: ProjectRow[];
  groups: ProjectGroup[];
  profiles: Profile[];
  pilarOptions: string[];
  accountOptions: string[];
  statusValues: string[];
  jenisValues: string[];
  doneStatuses: string[];
}) {
  const [pending, startTransition] = useTransition();

  const save = (id: string, field: string, value: string) =>
    startTransition(() => updateProjectField(id, field, value));

  const groupOptions: Option[] = groups.map((g) => ({ value: g.id, label: g.name || "Tanpa nama" }));
  const picOptions: Option[] = profiles.map((p) => ({
    value: p.id,
    label: p.full_name || p.email,
  }));

  return (
    <div className="space-y-2 w-full">
      <p className="h-4 text-xs text-muted">
        {pending ? "Menyimpan..." : "Klik sel untuk mengedit. Auto Save."}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[110rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              {headers.map((h) => (
                <th key={h} className="border-b border-border px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
              <th className="w-20 border-b border-border" />
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
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border align-top last:border-b-0",
                    doneStatuses.includes(row.status) && "bg-yellow-200 dark:bg-yellow-500/25",
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