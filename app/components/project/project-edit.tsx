"use client";

import { useTransition } from "react";

import { renameProject, updateProjectDescription } from "@/app/actions";

/** Judul + deskripsi project yang bisa diedit langsung di halaman board. */
export function ProjectHeader({
  id,
  pilar,
  name,
  description,
}: {
  id: string;
  pilar: string;
  name: string;
  description: string | null;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <input
        key={`pilar:${pilar ?? ""}`}
        defaultValue={pilar}
        aria-label="Pilar Konten"
        className="field-sizing-content min-w-40 max-w-full rounded-md bg-transparent px-1 py-0.5 text-2xl font-semibold outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onBlur={(e) => {
          const next = e.target.value.trim();
          if (!next) {
            e.target.value = name;
            return;
          }
          if (next !== name) startTransition(() => renameProject(id, next));
        }}
      />
      <input
        key={`name:${name}`}
        defaultValue={name}
        aria-label="Nama project"
        className="field-sizing-content min-w-40 max-w-full rounded-md bg-transparent px-1 py-0.5 text-2xl font-semibold outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onBlur={(e) => {
          const next = e.target.value.trim();
          if (!next) {
            e.target.value = name;
            return;
          }
          if (next !== name) startTransition(() => renameProject(id, next));
        }}
      />
      <input
        key={`desc:${description ?? ""}`}
        defaultValue={description ?? ""}
        placeholder="Tambah deskripsi..."
        aria-label="Deskripsi project"
        className="block w-full max-w-xl rounded-md bg-transparent px-1 py-0.5 text-sm text-muted outline-none transition-colors hover:bg-default/60 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-focus"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onBlur={(e) => {
          const next = e.target.value.trim();
          if (next !== (description ?? "")) {
            startTransition(() => updateProjectDescription(id, next));
          }
        }}
      />
    </div>
  );
}

/** Nama project di kartu, bisa diedit langsung. */
export function ProjectNameInput({ id, name }: { id: string; name: string }) {
  const [, startTransition] = useTransition();

  return (
    <input
      key={name}
      defaultValue={name}
      aria-label="Nama project"
      className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 font-medium outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus"
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      onBlur={(e) => {
        const next = e.target.value.trim();
        if (!next) {
          e.target.value = name;
          return;
        }
        if (next !== name) startTransition(() => renameProject(id, next));
      }}
    />
  );
}