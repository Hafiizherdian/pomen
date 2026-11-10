"use client";

import { useTransition } from "react";
import { Plus, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { Separator } from "@heroui/react";

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
  "field-sizing-content min-h-9 w-full resize-none rounded-md bg-transparent px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary focus:shadow-sm";

function onEnterBlur(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

function AddRowButton({
  onClick,
  label = "Tambah baris",
  variant = "ghost",
}: {
  onClick: () => void;
  label?: string;
  variant?: "ghost" | "dashed";
}) {
  const baseClass =
    "flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors duration-200";
  const variants = {
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground hover:bg-muted/50 cursor-pointer",
    dashed:
      "border-2 border-dashed border-border/60 text-muted-foreground hover:border-muted/50 hover:bg-muted/5 hover:text-primary",
  };

  return (
    <button type="button" onClick={onClick} className={`${baseClass} ${variants[variant]}`}>
      <Plus className="size-4" />
      {label}
    </button>
  );
}

function DeleteRowButton({
  onClick,
  label = "Hapus",
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
      className="group flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive"
    >
      <Trash2 className="size-4 transition-transform group-hover:scale-110" />
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
  accountId?: string;
}) {
  const columns = PILAR_COLUMNS[kind];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead className="bg-[#f97fb3] text-left">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                    col.className ?? ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-12 border-b border-border px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <AlertCircle className="size-5 opacity-50" />
                    <p>Belum ada data tersedia.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="group align-top transition-colors hover:bg-muted/20"
                >
                  {columns.map((col) => {
                    const value = row.data[col.key] ?? "";
                    return (
                      <td key={col.key} className="p-1.5">
                        <textarea
                          key={`${row.id}:${col.key}:${value}`}
                          defaultValue={value}
                          rows={1}
                          placeholder="Ketik sesuatu..."
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
                  <td className="p-1.5 align-middle">
                    <div className="flex h-full items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <DeleteRowButton onClick={() => handlers.remove(row.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AddRowButton variant="ghost" onClick={() => handlers.add(kind, accountId)} />
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
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {rows.length === 0 && (
        <p className="text-center text-sm italic text-muted-foreground py-2">
          Belum ada story untuk akun ini.
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((row) => {
          const value = row.data.item ?? "";
          return (
            <li
              key={row.id}
              className="group flex items-start gap-2 rounded-lg border border-transparent p-1 transition-colors hover:border-border hover:bg-muted/20"
            >
              <GripVertical className="mt-2.5 size-4 shrink-0 cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
              <textarea
                key={`${row.id}:${value}`}
                defaultValue={value}
                rows={1}
                placeholder="Tulis ide story..."
                aria-label="Story harian"
                className={`${cellClass} flex-1`}
                onKeyDown={onEnterBlur}
                onBlur={(e) => {
                  if (e.target.value !== value) {
                    handlers.save("story", row.id, "item", e.target.value);
                  }
                }}
              />
              <div className="mt-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <DeleteRowButton onClick={() => handlers.remove(row.id)} />
              </div>
            </li>
          );
        })}
      </ul>
      <AddRowButton
        label="Tambah Story"
        variant="ghost"
        onClick={() => handlers.add("story", accountId)}
      />
    </div>
  );
}

function AccountName({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  return (
    <label className="group flex items-center text-xl font-bold tracking-tight text-foreground">
      <span aria-hidden className="mr-0.5 text-muted-foreground/50 transition-colors group-hover:text-primary">
        @
      </span>
      <input
        key={value}
        defaultValue={value}
        placeholder="namaakun"
        aria-label="Nama akun"
        className="field-sizing-content min-w-[8rem] rounded-md bg-transparent px-1 py-0.5 outline-none transition-all placeholder:text-muted-foreground/30 hover:bg-muted focus:bg-background focus:ring-2 focus:ring-primary focus:shadow-sm"
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
        confirm(`Hapus ${label} beserta Content Pillar Breakdown dan Story (Daily)-nya?`)
      ) {
        startTransition(() => deletePilarAccount(account.id));
      }
    },
  };

  return (
    <div className="space-y-10 pb-20 relative">
      {/* Floating Status Indicator */}
      {/* <div className="sticky top-4 z-10 flex justify-end">
        <div
          className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md transition-all duration-300 ${
            pending
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted/50 text-muted-foreground border border-border/50"
          }`}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
              </span>
              Menyimpan...
            </span>
          ) : (
            ""
          )}
        </div>
      </div> */}

      {/* Tabel 1: Pilar Konten Utama */}
      <section className="space-y-4">
        <div className="px-1">
          <h2 className="text-lg font-semibold tracking-tight">Overview Pilar Konten</h2>
          {/* <p className="text-sm text-muted-foreground">Kelola pilar konten utama untuk strategi Anda.</p> */}
        </div>
        <EditableTable kind="overview" rows={rows.overview} handlers={handlers} />
      </section>

      <Separator className="my-8 opacity-50" />

      {/* Per akun: Content Pillar Breakdown + Story (Daily) */}
      <section className="space-y-6">
        <div className="px-1 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Breakdown Per Akun</h2>
            <p className="text-sm text-muted-foreground">Rincian konten dan story harian untuk setiap akun.</p>
          </div>
          <button 
            onClick={handlers.addAccount}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
          >
            <Plus className="size-4" />
            Tambah Akun
          </button>
        </div>

        {accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
            <div className="rounded-full bg-muted/50 p-4 mb-3">
              <AlertCircle className="size-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">Belum ada akun</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Mulai dengan menambahkan akun untuk membuat Content Pillar Breakdown dan Story (Daily).
            </p>
          </div>
        )}

        <div className="space-y-8">
          {accounts.map((account) => (
            <article
              key={account.id}
              className="group/card overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-all hover:border-border hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 px-6 py-4">
                <AccountName
                  value={account.name}
                  onSave={(value) => handlers.saveAccount(account.id, value)}
                />
                <button
                  onClick={() => handlers.removeAccount(account)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/card:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                  Hapus Akun
                </button>
              </div>

              {/* Card Body */}
              <div className="space-y-8 p-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Pillar Breakdown
                  </h3>
                  <EditableTable
                    kind="breakdown"
                    accountId={account.id}
                    rows={rows.breakdown.filter((row) => row.account_id === account.id)}
                    handlers={handlers}
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Story (Daily)
                  </h3>
                  <StoryList
                    accountId={account.id}
                    rows={rows.story.filter((row) => row.account_id === account.id)}
                    handlers={handlers}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}