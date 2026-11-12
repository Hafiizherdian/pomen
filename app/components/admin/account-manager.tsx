"use client";

import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";

import {
  createAccount,
  resetAccountPassword,
  setAccountActive,
  setAccountRole,
} from "@/app/account-actions";
import { StatusLine, inputClass } from "@/app/components/admin/admin-ui";
import { useAdminAction, type RunAction } from "@/app/components/admin/use-admin-action";
import type { AccountRow } from "@/lib/admin-types";
import { ROLES, ROLE_LABEL, isRole, type Role } from "@/lib/roles";

const smallSelect =
  "h-8 rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-focus disabled:opacity-50";

function PasswordCell({ account, run }: { account: AccountRow; run: RunAction }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted transition-colors hover:bg-default hover:text-foreground"
      >
        <KeyRound className="size-3.5" />
        {account.has_password ? "Ganti password" : "Buat password"}
      </button>
    );
  }

  return (
    <form
      className="flex gap-1"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(() => resetAccountPassword(account.id, value));
        if (ok) {
          setOpen(false);
          setValue("");
        }
      }}
    >
      <input
        type="password"
        required
        minLength={8}
        autoFocus
        autoComplete="new-password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Min. 8 karakter"
        className={`${smallSelect} w-40`}
      />
      <button
        type="submit"
        className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground"
      >
        Simpan
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setValue("");
        }}
        className="h-8 rounded-md px-2 text-xs transition-colors hover:bg-default"
      >
        Batal
      </button>
    </form>
  );
}

function AccountLine({
  account,
  isSelf,
  run,
}: {
  account: AccountRow;
  isSelf: boolean;
  run: RunAction;
}) {
  return (
    <tr className="border-b border-border align-middle last:border-b-0">
      <td className="px-4 py-2.5">
        <p className="font-medium">{account.full_name || "-"}</p>
        {isSelf && <p className="text-xs text-muted">Akun kamu</p>}
      </td>
      <td className="px-4 py-2.5 text-muted">{account.email}</td>
      <td className="px-4 py-2.5">
        <select
          key={account.role}
          defaultValue={account.role}
          disabled={isSelf}
          aria-label="Peran"
          className={smallSelect}
          onChange={(e) => {
            const next = e.target.value;
            if (isRole(next)) run(() => setAccountRole(account.id, next));
          }}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2.5">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={account.is_active && account.has_password}
            disabled={isSelf || !account.has_password}
            onChange={(e) => run(() => setAccountActive(account.id, e.target.checked))}
          />
          {!account.has_password ? "Belum bisa login" : account.is_active ? "Aktif" : "Nonaktif"}
        </label>
      </td>
      <td className="px-4 py-2.5">
        <PasswordCell account={account} run={run} />
      </td>
    </tr>
  );
}

export function AccountManager({
  accounts,
  currentUserId,
}: {
  accounts: AccountRow[];
  currentUserId: string;
}) {
  const { pending, error, run } = useAdminAction();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "user" as Role,
    password: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => createAccount(form));
    if (ok) setForm({ full_name: "", email: "", role: "user", password: "" });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_8rem_1fr_auto] sm:items-end"
      >
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Nama lengkap</span>
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Email *</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Peran</span>
          <select
            value={form.role}
            onChange={(e) => isRole(e.target.value) && setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Password awal *</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          <Plus className="size-4" />
          Buat akun
        </button>
      </form>

      <StatusLine
        pending={pending}
        error={error}
        hint="Kalau email sudah ada di Anggota Tim, akunnya diberi akses login dengan peran dan password ini."
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Nama</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Email</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Peran</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Status login</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Password</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <AccountLine
                key={account.id}
                account={account}
                isSelf={account.id === currentUserId}
                run={run}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}