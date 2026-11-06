"use client";

import { useTransition } from "react";

import { updateProjectStatus } from "@/app/actions";
import { PROJECT_STATUSES } from "@/lib/project-config";

export function ProjectStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      key={status}
      defaultValue={status}
      disabled={pending}
      aria-label="Status"
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => updateProjectStatus(id, next));
      }}
      className="h-8 rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-focus disabled:opacity-50"
    >
      {PROJECT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}