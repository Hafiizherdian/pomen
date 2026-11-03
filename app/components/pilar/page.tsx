"use client";

import { useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import { addPilarRow, deletePilarRow, updatePilarCell } from "@/app/pilar-actions";
import { PILAR_COLUMNS, type PilarKind, type PilarRow, type PilarRows } from "@/lib/pilar-config";

type Handlers = {
  add: (kind: PilarKind) => void;
  save: (kind: PilarKind, id: string, field: string, value: string) => void;
  remove: (id: string) => void;
};

const cellClass =
  "field-sizing-content min-h-8 w-full resize-none rounded-md bg-transparent px-2 py-1 outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus";

function onEnterBlur(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

function AddRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-default hover:text-foreground"
    >
      <Plus className="size-4" />
      Tambah baris
    </button>
  );
}

function DeleteRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Hapus baris"
      title="Hapus baris"
      onClick={onClick}
      className="rounded-md p-1 text-muted transition-colors hover:bg-default hover:text-danger"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function EditableTable({
  kind,
  rows,
  handlers,
}: {
  kind: PilarKind;
  rows: PilarRow[];
  handlers: Handlers;
}) {
  const columns = PILAR_COLUMNS[kind];

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`border-b border-border px-4 py-2.5 font-semibold ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-10 border-b border-border" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-muted">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border align-top last:border-b-0">
                  {columns.map((col) => {
                    const value = row.data[col.key] ?? "";
                    return (
                      <td key={col.key} className="px-2 py-1.5">
                        <textarea
                          key={`${row.id}:${col.key}:${value}`}
                          defaultValue={value}
                          rows={1}
                          aria-label={col.label}
                          className={cellClass}
                          onKeyDown={onEnterBlur}
                          onBlur={(e) => {
                            if (e.target.value !== value) {
                              handlers.save(kind, row.id, col.key, e.target.value);
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5">
                    <DeleteRowButton onClick={() => handlers.remove(row.id)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AddRowButton onClick={() => handlers.add(kind)} />
    </div>
  );
}

function StoryList({ rows, handlers }: { rows: PilarRow[]; handlers: Handlers }) {
  return (
    <div className="space-y-1">
      {rows.length === 0 && <p className="text-sm text-muted">Belum ada data.</p>}
      <ul className="space-y-1">
        {rows.map((row) => {
          const value = row.data.item ?? "";
          return (
            <li key={row.id} className="flex items-start gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/60" />
              <textarea
                key={`${row.id}:${value}`}
                defaultValue={value}
                rows={1}
                aria-label="Story harian"
                className={`${cellClass} flex-1 text-sm`}
                onKeyDown={onEnterBlur}
                onBlur={(e) => {
                  if (e.target.value !== value) {
                    handlers.save("story", row.id, "item", e.target.value);
                  }
                }}
              />
              <DeleteRowButton onClick={() => handlers.remove(row.id)} />
            </li>
          );
        })}
      </ul>
      <AddRowButton onClick={() => handlers.add("story")} />
    </div>
  );
}

export function PilarContent({ rows }: { rows: PilarRows }) {
  const [pending, startTransition] = useTransition();

  const handlers: Handlers = {
    add: (kind) => startTransition(() => addPilarRow(kind)),
    save: (kind, id, field, value) =>
      startTransition(() => updatePilarCell(kind, id, field, value)),
    remove: (id) => {
      if (confirm("Hapus baris ini?")) startTransition(() => deletePilarRow(id));
    },
  };

  return (
    <div className="space-y-8">
      <p className="h-4 text-xs text-muted">
        {pending ? "Menyimpan..." : "Klik sel untuk mengedit. Tersimpan otomatis saat keluar dari sel."}
      </p>

      {/* Tabel 1: Pilar Konten */}
      <EditableTable kind="overview" rows={rows.overview} handlers={handlers} />

      {/* Tabel 2: Content Pillar Breakdown */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Content Pillar Breakdown</h2>
        <EditableTable kind="breakdown" rows={rows.breakdown} handlers={handlers} />
      </section>

      {/* Story (Daily) */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Story (Daily):</h3>
        <StoryList rows={rows.story} handlers={handlers} />
      </section>

      {/* Ringkasan target produksi */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Ringkasan Target Produksi per Akun / Minggu
        </h2>
        <EditableTable kind="target" rows={rows.target} handlers={handlers} />
      </section>
    </div>
  );
}