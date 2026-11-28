"use client";

import { useTransition } from "react";

import { updateProjectStatus } from "@/app/actions";
import { cn } from "@/lib/utils";

export function ProjectStatusSelect({
  id,
  status,
  statuses,
  className,
}: {
  id: string;
  status: string;
  /** Daftar status dari Admin > Data status & jenis. */
  statuses: string[];
  /** Warna status yang sedang dipilih. */
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  // Nilai tersimpan tetap muncul walau sudah tidak ada di daftar.
  const options = statuses.includes(status) ? statuses : [status, ...statuses];

  return (
    <select
      key={status}
      defaultValue={status}
      disabled={pending}
      aria-label="Status"
      aria-busy={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => updateProjectStatus(id, next));
      }}
      className={cn(
        "h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-focus disabled:opacity-50",
        className,
      )}
    >
      {options.map((s) => (
        <option key={s} value={s} className="bg-background text-foreground">
          {s}
        </option>
      ))}
    </select>
  );
}