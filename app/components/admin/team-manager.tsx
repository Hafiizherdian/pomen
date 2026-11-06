"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { createMember, deleteMember, updateMember } from "@/app/admin-actions";
import {
  IconButton,
  StatusLine,
  blurOnEnter,
  cellClass,
  inputClass,
} from "@/app/components/admin/admin-ui";
import { useAdminAction, type RunAction } from "@/app/components/admin/use-admin-action";
import type { MemberRow } from "@/lib/admin-types";

function MemberLine({ member, run }: { member: MemberRow; run: RunAction }) {
  const label = member.full_name || member.email;

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="min-w-48 px-2 py-1.5">
        <input
          key={member.full_name ?? ""}
          defaultValue={member.full_name ?? ""}
          placeholder="Nama lengkap"
          aria-label="Nama lengkap"
          className={cellClass}
          onKeyDown={blurOnEnter}
          onBlur={async (e) => {
            const input = e.currentTarget;
            const next = input.value.trim();
            if (next === (member.full_name ?? "")) return;
            const ok = await run(() =>
              updateMember(member.id, { email: member.email, full_name: next }),
            );
            if (!ok) input.value = member.full_name ?? "";
          }}
        />
      </td>
      <td className="min-w-56 px-2 py-1.5">
        <input
          key={member.email}
          defaultValue={member.email}
          type="email"
          aria-label="Email"
          className={cellClass}
          onKeyDown={blurOnEnter}
          onBlur={async (e) => {
            const input = e.currentTarget;
            const next = input.value.trim();
            if (next === member.email) return;
            const ok = await run(() =>
              updateMember(member.id, { email: next, full_name: member.full_name ?? "" }),
            );
            if (!ok) input.value = member.email;
          }}
        />
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{member.project_count}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{member.task_count}</td>
      <td className="px-2 py-1.5">
        <IconButton
          danger
          label="Hapus anggota"
          onClick={() => {
            const impact =
              member.project_count + member.task_count > 0
                ? ` ${member.project_count} konten dan ${member.task_count} task akan menjadi tanpa PIC/penerima.`
                : "";
            if (confirm(`Hapus ${label}?${impact}`)) run(() => deleteMember(member.id));
          }}
        >
          <Trash2 className="size-4" />
        </IconButton>
      </td>
    </tr>
  );
}

export function TeamManager({ members }: { members: MemberRow[] }) {
  const { pending, error, run } = useAdminAction();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => createMember({ email, full_name: name }));
    if (ok) {
      setEmail("");
      setName("");
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Nama lengkap</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Wowo"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          <span>Email *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bunted@cgkn.com"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          <Plus className="size-4" />
          Tambah anggota
        </button>
      </form>

      <StatusLine
        pending={pending}
        error={error}
        hint="Klik nama atau email untuk mengedit. Tersimpan otomatis saat keluar dari kolom."
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Nama</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Email</th>
              <th className="border-b border-border px-3 py-2.5 text-right font-semibold">
                Jadi PIC
              </th>
              <th className="border-b border-border px-3 py-2.5 text-right font-semibold">
                Task
              </th>
              <th className="w-10 border-b border-border" />
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Belum ada anggota. Tambahkan anggota agar bisa dipilih sebagai PIC.
                </td>
              </tr>
            ) : (
              members.map((member) => <MemberLine key={member.id} member={member} run={run} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}