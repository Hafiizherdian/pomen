"use client";

import { useState } from "react";
import { Copy, History, KeyRound, Plus, RefreshCw } from "lucide-react";

import {
  createAccount,
  resetAccountPassword,
  setAccountActive,
  setAccountRole,
  setAccountUsername,
} from "@/app/account-actions";
import {
  StatusLine,
  blurOnEnter,
  cellClass,
  inputClass,
} from "@/app/components/admin/admin-ui";
import { LoginHistoryModal } from "@/app/components/admin/login-history-modal";
import { useAdminAction, type RunAction } from "@/app/components/admin/use-admin-action";
import type { AccountRow } from "@/lib/admin-types";
import { generatePassword } from "@/lib/password-generator";
import { ROLES, ROLE_LABEL, isRole, type Role } from "@/lib/roles";

const smallSelect =
  "h-8 rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-focus disabled:opacity-50";

const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-default hover:text-foreground disabled:opacity-50";

/** Tombol buat password acak dan salin. */
function PasswordTools({ value, onGenerate }: { value: string; onGenerate: (v: string) => void }) {
  const [message, setMessage] = useState({ text: "", for: "" });

  return (
    <>
      <button
        type="button"
        title="Buat password otomatis"
        aria-label="Buat password otomatis"
        onClick={() => onGenerate(generatePassword())}
        className={iconButton}
      >
        <RefreshCw className="size-3.5" />
      </button>
      <button
        type="button"
        title="Salin password"
        aria-label="Salin password"
        disabled={!value}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setMessage({ text: "Disalin", for: value });
          } catch {
            // Clipboard tidak tersedia, misalnya di HTTP tanpa SSL.
            setMessage({ text: "Salin manual", for: value });
          }
        }}
        className={iconButton}
      >
        <Copy className="size-3.5" />
      </button>
      <span role="status" className="self-center text-xs text-muted">
        {value && message.for === value ? message.text : ""}
      </span>
    </>
  );
}

function PasswordCell({ account, run }: { account: AccountRow; run: RunAction }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  function close() {
    setOpen(false);
    setValue("");
    setVisible(false);
  }

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
        if (ok) close();
      }}
    >
      <input
        type={visible ? "text" : "password"}
        required
        minLength={8}
        autoFocus
        autoComplete="new-password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Min. 8 karakter"
        className={`${smallSelect} w-40 font-mono`}
      />
      <PasswordTools
        value={value}
        onGenerate={(v) => {
          setValue(v);
          setVisible(true);
        }}
      />
      <button
        type="submit"
        className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground"
      >
        Simpan
      </button>
      <button
        type="button"
        onClick={close}
        className="h-8 rounded-md px-2 text-xs transition-colors hover:bg-default"
      >
        Batal
      </button>
    </form>
  );
}

function HistoryCell({ account }: { account: AccountRow }) {
  const [open, setOpen] = useState(false);
  const name = account.full_name || account.username || account.email;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Riwayat login ${name}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted transition-colors hover:bg-default hover:text-foreground"
      >
        <History className="size-3.5" />
        Lihat
      </button>
      {open && (
        <LoginHistoryModal accountId={account.id} accountName={name} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function statusLabel(account: AccountRow) {
  if (!account.has_password) return "Belum ada password";
  if (!account.username) return "Belum ada username";
  return account.is_active ? "Aktif" : "Nonaktif";
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
        {isSelf && <p className="text-xs text-muted">Akun anda</p>}
      </td>
      <td className="min-w-44 px-2 py-1.5">
        <input
          key={account.username ?? ""}
          defaultValue={account.username ?? ""}
          placeholder="Belum ada"
          aria-label="Username"
          autoCapitalize="none"
          spellCheck={false}
          className={cellClass}
          onKeyDown={blurOnEnter}
          onBlur={async (e) => {
            const input = e.currentTarget;
            const current = account.username ?? "";
            const next = input.value.trim().toLowerCase();
            if (next === current) {
              input.value = current;
              return;
            }
            const ok = await run(() => setAccountUsername(account.id, next));
            if (!ok) input.value = current;
          }}
        />
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
            checked={account.can_login && account.is_active}
            disabled={isSelf || !account.can_login}
            onChange={(e) => run(() => setAccountActive(account.id, e.target.checked))}
          />
          {statusLabel(account)}
        </label>
      </td>
      <td className="px-4 py-2.5">
        <HistoryCell account={account} />
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
    username: "",
    full_name: "",
    email: "",
    role: "user" as Role,
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => createAccount(form));
    if (ok) {
      setForm({ username: "", full_name: "", email: "", role: "user", password: "" });
      setShowPassword(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end"
      >
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Username *</span>
          <input
            required
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="off"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="contoh: wowo"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Nama lengkap</span>
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Email (opsional)</span>
          <input
            type="email"
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
        <div className="grid gap-1 text-xs font-medium text-muted">
          <label htmlFor="new-password">Password awal *</label>
          <div className="flex gap-1">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`${inputClass} min-w-0 flex-1 font-mono`}
            />
            <PasswordTools
              value={form.password}
              onGenerate={(password) => {
                setForm((f) => ({ ...f, password }));
                setShowPassword(true);
              }}
            />
          </div>
        </div>
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
        hint="Isi email yang sama dengan anggota di Anggota Tim untuk memberinya akses login. Username bisa diedit langsung di tabel. Salin password sebelum menyimpan."
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[68rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Nama</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Username</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Email</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Role</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Status login</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Riwayat</th>
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