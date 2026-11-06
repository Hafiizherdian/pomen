"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import {
  addOption,
  deleteOption,
  moveOption,
  renameOption,
  setOptionFinal,
} from "@/app/admin-actions";
import {
  IconButton,
  StatusLine,
  blurOnEnter,
  cellClass,
  inputClass,
} from "@/app/components/admin/admin-ui";
import { useAdminAction, type RunAction } from "@/app/components/admin/use-admin-action";
import type { MasterKind, OptionRow } from "@/lib/admin-types";

function OptionList({
  kind,
  title,
  description,
  options,
  run,
  showFinal,
}: {
  kind: MasterKind;
  title: string;
  description: string;
  options: OptionRow[];
  run: RunAction;
  showFinal?: boolean;
}) {
  const [value, setValue] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => addOption(kind, value));
    if (ok) setValue("");
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted">{description}</p>
      </div>

      <ul className="space-y-2">
        {options.length === 0 && <li className="text-sm text-muted">Belum ada pilihan.</li>}
        {options.map((option, index) => (
          <li
            key={option.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2"
          >
            <div className="flex flex-col">
              <IconButton
                label="Naikkan"
                disabled={index === 0}
                onClick={() => run(() => moveOption(option.id, "up"))}
              >
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                label="Turunkan"
                disabled={index === options.length - 1}
                onClick={() => run(() => moveOption(option.id, "down"))}
              >
                <ChevronDown className="size-4" />
              </IconButton>
            </div>

            <input
              key={option.value}
              defaultValue={option.value}
              aria-label={`Nama ${title.toLowerCase()}`}
              className={`${cellClass} min-w-32 flex-1`}
              onKeyDown={blurOnEnter}
              onBlur={async (e) => {
                const input = e.currentTarget;
                const next = input.value.trim();
                if (next === option.value) return;
                if (!next) {
                  input.value = option.value;
                  return;
                }
                const ok = await run(() => renameOption(option.id, next));
                if (!ok) input.value = option.value;
              }}
            />

            {showFinal && (
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={option.is_final}
                  onChange={(e) => run(() => setOptionFinal(option.id, e.target.checked))}
                />
                Dihitung selesai
              </label>
            )}

            <span className="shrink-0 text-xs tabular-nums text-muted">{option.usage} konten</span>

            <IconButton
              danger
              label="Hapus pilihan"
              onClick={() => {
                if (confirm(`Hapus pilihan "${option.value}"?`)) run(() => deleteOption(option.id));
              }}
            >
              <Trash2 className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Tambah ${title.toLowerCase()} baru...`}
          aria-label={`Tambah ${title.toLowerCase()} baru`}
          className={inputClass}
        />
        <button
          type="submit"
          aria-label={`Tambah ${title.toLowerCase()}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </section>
  );
}

export function MasterOptionsManager({ options }: { options: OptionRow[] }) {
  const { pending, error, run } = useAdminAction();

  return (
    <div className="space-y-4">
      <StatusLine
        pending={pending}
        error={error}
        hint="Urutan di sini menjadi urutan di dropdown. Mengganti nama ikut memperbarui semua konten yang memakainya."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <OptionList
          kind="status"
          title="Status"
          description='Status "Dihitung selesai" diberi highlight kuning di tabel Project dan dihitung sebagai selesai di Laporan.'
          options={options.filter((o) => o.kind === "status")}
          run={run}
          showFinal
        />
        <OptionList
          kind="jenis"
          title="Jenis Konten"
          description="Pilihan di kolom Jenis Konten pada tabel dan form Project."
          options={options.filter((o) => o.kind === "jenis")}
          run={run}
        />
      </div>
    </div>
  );
}