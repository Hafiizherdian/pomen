"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus";

export const cellClass =
  "h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus";

export function blurOnEnter(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") e.currentTarget.blur();
}

export function IconButton({
  label,
  onClick,
  danger,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md p-1 text-muted transition-colors hover:bg-default disabled:pointer-events-none disabled:opacity-30",
        danger ? "hover:text-danger" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Baris status: pesan error jika ada, selain itu "Menyimpan..." atau petunjuk. */
export function StatusLine({
  pending,
  error,
  hint,
}: {
  pending: boolean;
  error: string | null;
  hint: string;
}) {
  return (
    <div className="min-h-5 text-xs">
      {error ? (
        <p role="alert" className="text-danger">
          {error}
        </p>
      ) : (
        <p className="text-muted">{pending ? "Menyimpan..." : hint}</p>
      )}
    </div>
  );
}