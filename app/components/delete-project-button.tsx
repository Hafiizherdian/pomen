"use client";

import { Trash2 } from "lucide-react";
import { deleteProject } from "@/app/actions";

export function DeleteProjectButton({ id }: { id: string }) {
  return (
    <form
      action={deleteProject}
      onSubmit={(e) => {
        if (!confirm("Hapus project ini beserta semua task-nya?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Hapus project"
        className="rounded-md p-1 text-muted transition-colors hover:bg-default hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}