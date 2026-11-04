"use client";

import { useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {Separator} from "@heroui/react";

import {
  addPilarAccount,
  addPilarRow,
  deletePilarAccount,
  deletePilarRow,
  updatePilarAccount,
  updatePilarCell,
} from "@/app/pilar-actions";
import {
  PILAR_COLUMNS,
  type PilarAccount,
  type PilarKind,
  type PilarRow,
  type PilarRows,
} from "@/lib/pilar-config";

type Handlers = {
  add: (kind: PilarKind, accountId?: string) => void;
  save: (kind: PilarKind, id: string, field: string, value: string) => void;
  remove: (id: string) => void;
  addAccount: () => void;
  saveAccount: (id: string, value: string) => void;
  removeAccount: (account: PilarAccount) => void;
};

const cellClass =
  "field-sizing-content min-h-8 w-full resize-none rounded-md bg-transparent px-2 py-1 outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus";

function onEnterBlur(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

function AddRowButton({
  onClick,
  label = "Tambah baris",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-default hover:text-foreground"
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}

function DeleteRowButton({
  onClick,
  label = "Hapus baris",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
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
  accountId,
}: {
  kind: PilarKind;
  rows: PilarRow[];
  handlers: Handlers;
  /** Wajib untuk tabel yang dimiliki per akun (breakdown). */
  accountId?: string;
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
      <AddRowButton onClick={() => handlers.add(kind, accountId)} />
    </div>
  );
}

function StoryList({
  rows,
  handlers,
  accountId,
}: {
  rows: PilarRow[];
  handlers: Handlers;
  accountId: string;
}) {
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
      <AddRowButton onClick={() => handlers.add("story", accountId)} />
    </div>
  );
}

function AccountName({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  return (
    <label className="flex items-center text-base font-semibold">
      <span aria-hidden className="text-muted">
        @
      </span>
      <input
        key={value}
        defaultValue={value}
        placeholder="namaakun"
        aria-label="Nama akun"
        className="field-sizing-content min-w-24 rounded-md bg-transparent px-1 py-0.5 outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onBlur={(e) => {
          const next = e.target.value.trim().replace(/^@+/, "");
          e.target.value = next;
          if (next !== value) onSave(next);
        }}
      />
    </label>
  );
}

export function PilarContent({
  rows,
  accounts,
}: {
  rows: PilarRows;
  accounts: PilarAccount[];
}) {
  const [pending, startTransition] = useTransition();

  const handlers: Handlers = {
    add: (kind, accountId) => startTransition(() => addPilarRow(kind, accountId)),
    save: (kind, id, field, value) =>
      startTransition(() => updatePilarCell(kind, id, field, value)),
    remove: (id) => {
      if (confirm("Hapus baris ini?")) startTransition(() => deletePilarRow(id));
    },
    addAccount: () => startTransition(() => addPilarAccount()),
    saveAccount: (id, value) => startTransition(() => updatePilarAccount(id, value)),
    removeAccount: (account) => {
      const label = account.name ? `@${account.name}` : "akun ini";
      if (
        confirm(
          `Hapus ${label} beserta Content Pillar Breakdown dan Story (Daily)-nya?`,
        )
      ) {
        startTransition(() => deletePilarAccount(account.id));
      }
    },
  };

  return (
    <div className="space-y-8">
      <p className="h-4 text-xs text-muted">
        {pending ? "Menyimpan..." : "Klik sel untuk mengedit. Tersimpan otomatis saat keluar dari sel."}
      </p>

      {/* Tabel 1: Pilar Konten */}
      <EditableTable kind="overview" rows={rows.overview} handlers={handlers} />

      {/* Per akun: Content Pillar Breakdown + Story (Daily) */}
      {accounts.length === 0 && (
        <p className="text-sm text-muted">
          Belum ada akun. Tambah akun untuk membuat Content Pillar Breakdown dan Story (Daily).
        </p>
      )}

            <Separator className="bg-separator-secondary" />

      {accounts.map((account) => (
        <section key={account.id} className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <AccountName
                value={account.name}
                onSave={(value) => handlers.saveAccount(account.id, value)}
              />
              <h2 className="text-base font-semibold">Content Pillar Breakdown</h2>
            </div>
            <DeleteRowButton
              label="Hapus akun"
              onClick={() => handlers.removeAccount(account)}
            />
          </div>

          <EditableTable
            kind="breakdown"
            accountId={account.id}
            rows={rows.breakdown.filter((row) => row.account_id === account.id)}
            handlers={handlers}
          />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Story (Daily):</h3>
            <StoryList
              accountId={account.id}
              rows={rows.story.filter((row) => row.account_id === account.id)}
              handlers={handlers}
            />
          </div>
                <Separator className="bg-separator-secondary" />
        </section>
      ))}

      <AddRowButton label="Tambah akun" onClick={handlers.addAccount} />

      {/* Ringkasan target produksi */}
      {/* <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Ringkasan Target Produksi per Akun / Minggu
        </h2>
        <EditableTable kind="target" rows={rows.target} handlers={handlers} />
      </section> */}
    </div>
  );
}