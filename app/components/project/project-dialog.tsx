"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { createProject } from "@/app/actions";
import type { Profile, ProjectGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus";

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-1 text-xs font-medium text-muted", wide && "sm:col-span-2")}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function NewProjectDialog({
  pilarOptions,
  accountOptions,
  statusOptions,
  jenisOptions,
  profiles,
  groups,
  defaultGroupId,
  defaultPeriode,
}: {
  pilarOptions: string[];
  accountOptions: string[];
  statusOptions: string[];
  jenisOptions: string[];
  profiles: Profile[];
  groups: ProjectGroup[];
  defaultGroupId: string;
  defaultPeriode: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
      >
        <Plus className="size-4" />
        Buat project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            action={createProject}
            role="dialog"
            aria-modal="true"
            aria-label="Buat project"
            className="grid max-h-[90vh] w-full max-w-3xl gap-3 overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl sm:grid-cols-2"
          >
            <div className="flex items-center justify-between sm:col-span-2">
              <h2 className="text-lg font-semibold">Buat project</h2>
              <button
                type="button"
                aria-label="Tutup"
                title="Tutup"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <Field label="Pilar Konten *">
              <select name="pilar" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  {pilarOptions.length === 0
                    ? "Belum ada pilar. Isi dulu di halaman Pilar Konten"
                    : "Pilih pilar konten"}
                </option>
                {pilarOptions.map((pilar) => (
                  <option key={pilar} value={pilar}>
                    {pilar}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Judul Konten *">
              <input name="name" required autoFocus className={inputClass} />
            </Field>
                        <Field label="Bulan *">
              <input
                type="month"
                name="periode"
                required
                defaultValue={defaultPeriode}
                className={inputClass}
              />
            </Field>
            <Field label="Jenis Konten">
              <select name="jenis" defaultValue="" className={inputClass}>
                <option value="">Pilih jenis konten</option>
                {jenisOptions.map((jenis) => (
                  <option key={jenis} value={jenis}>
                    {jenis}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tema">
              <input name="tema" className={inputClass} />
            </Field>
            <Field label="Akun *">
              <select name="akun" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  {accountOptions.length === 0
                    ? "Belum ada akun. Isi dulu di halaman Pilar Konten"
                    : "Pilih akun"}
                </option>
                {accountOptions.map((akun) => (
                  <option key={akun} value={akun}>
                    {akun}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fokus Keyword">
              <input name="keyword" className={inputClass} />
            </Field>
            <Field label="HOOK">
              <input name="hook" className={inputClass} />
            </Field>
            <Field label="Call To Action">
              <input name="cta" className={inputClass} />
            </Field>
            <Field label="Tgl Produksi">
              <input type="date" name="prod" className={inputClass} />
            </Field>
            <Field label="Tgl Masuk Editor">
              <input type="date" name="editor" className={inputClass} />
            </Field>
            <Field label="Tgl Selesai">
              <input type="date" name="selesai" className={inputClass} />
            </Field>
            <Field label="Tgl Upload">
              <input type="date" name="upload" className={inputClass} />
            </Field>
            <Field label="PIC">
              <select name="pic" defaultValue="" className={inputClass}>
                <option value="">Belum ditentukan</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={statusOptions[0] ?? ""} className={inputClass}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Group">
              <select name="group_id" defaultValue={defaultGroupId} className={inputClass}>
                <option value="">Tanpa group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Deskripsi (opsional)" wide>
              <textarea name="description" rows={2} className={inputClass} />
            </Field>

            <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-lg px-4 text-sm transition-colors hover:bg-default"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
              >
                Buat project
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}