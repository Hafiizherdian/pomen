"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  createProjectGroup,
  deleteProjectGroup,
  renameProjectGroup,
  setProjectGroup,
  setProjectGroupColor,
} from "@/app/actions";
import { FolderIcon } from "@/app/components/ui/folder-icon";
import type { ProjectGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import {ColorSwatchPicker} from "@heroui/react";
import {HeartFill} from "@gravity-ui/icons";

export const GROUP_COLORS = [
  "#f97fb3",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#94a3b8",
];

/**
 * Pilihan warna: swatch siap pakai + pemilih warna bebas.
 * `commit` = true saat pilihan sudah final (klik swatch / pemilih warna ditutup).
 */
function ColorSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string, commit: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {GROUP_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Warna ${color}`}
          title={color}
          onClick={() => onChange(color, true)}
          style={{ backgroundColor: color }}
          className={cn(
            "size-6 rounded-full border-2 transition-transform hover:scale-110",
            value.toLowerCase() === color ? "border-foreground" : "border-transparent",
          )}
        />
      ))}
      <label
        title="Pilih warna lain"
        className="relative flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border"
      >
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
          }}
        />
        <input
          type="color"
          value={value}
          aria-label="Pilih warna lain"
          onChange={(e) => onChange(e.target.value, false)}
          onBlur={(e) => onChange(e.target.value, true)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

/** Ganti warna folder group yang sedang dibuka. */
export function GroupColorPicker({ id, color }: { id: string; color: string }) {
  const [, startTransition] = useTransition();

  return (
    <ColorSwatchPicker
      value={color}
      onChange={(newColor) => {
        // Tambahkan argumen "hex" di dalam toString()
        const hexColor = newColor.toString("hex");

        if (hexColor && hexColor.toLowerCase() !== color.toLowerCase()) {
          startTransition(() => setProjectGroupColor(id, hexColor));
        }
      }}
    >
      {GROUP_COLORS.map((c) => (
        <ColorSwatchPicker.Item key={c} color={c}>
          <ColorSwatchPicker.Swatch />
          <ColorSwatchPicker.Indicator>
            <HeartFill />
          </ColorSwatchPicker.Indicator>
        </ColorSwatchPicker.Item>
      ))}
    </ColorSwatchPicker>
  );
}

/** Tile "Group baru": buka form kecil berisi nama dan warna. */
export function NewGroupTile() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(GROUP_COLORS[0]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-32 flex-col items-center gap-1 rounded-xl border-2 border-dashed border-border p-2 text-muted transition-colors hover:bg-default/60 hover:text-foreground cursor-pointer"
      >
        <div className="flex aspect-[600/520] w-full items-center justify-center">
          <Plus className="size-8" />
        </div>
        <span className="text-sm font-medium">Group baru</span>
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createProjectGroup(formData);
        setOpen(false);
        setColor(GROUP_COLORS[0]);
      }}
      className="flex w-64 flex-col gap-3 rounded-xl border border-border bg-surface p-3"
    >
      <FolderIcon color={color} className="mx-auto w-24" />
      <input
        name="name"
        required
        autoFocus
        placeholder="Nama group"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus"
      />
      <input type="hidden" name="color" value={color} />
      <ColorSwatches value={color} onChange={(next) => setColor(next)} />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 rounded-lg px-3 text-sm transition-colors hover:bg-default"
        >
          Batal
        </button>
        <button
          type="submit"
          className="h-8 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground"
        >
          Buat
        </button>
      </div>
    </form>
  );
}

/** Nama group yang bisa diedit langsung. Tersimpan saat keluar dari kolom. */
export function GroupName({ id, name }: { id: string; name: string }) {
  const [, startTransition] = useTransition();

  return (
    <input
      key={name}
      defaultValue={name}
      aria-label="Nama group"
      className="field-sizing-content min-w-24 rounded-md bg-transparent px-1 py-0.5 text-base font-semibold outline-none transition-colors hover:bg-default/60 focus:bg-background focus:ring-2 focus:ring-focus"
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      onBlur={(e) => {
        const next = e.target.value.trim();
        if (!next) {
          e.target.value = name;
          return;
        }
        if (next !== name) startTransition(() => renameProjectGroup(id, next));
      }}
    />
  );
}

export function DeleteGroupButton({ id, name }: { id: string; name: string }) {
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Hapus group"
      title="Hapus group"
      onClick={() => {
        if (
          confirm(
            `Hapus group "${name}"? Project di dalamnya tidak ikut terhapus, hanya menjadi tanpa group.`,
          )
        ) {
          startTransition(() => deleteProjectGroup(id));
        }
      }}
      className="rounded-md p-1 text-muted transition-colors hover:bg-default hover:text-danger"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

/** Dropdown untuk memindahkan project ke group lain. */
export function ProjectGroupSelect({
  projectId,
  groupId,
  groups,
}: {
  projectId: string;
  groupId: string | null;
  groups: ProjectGroup[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      key={groupId ?? ""}
      defaultValue={groupId ?? ""}
      disabled={pending}
      aria-label="Group project"
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => setProjectGroup(projectId, next));
      }}
      className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-focus disabled:opacity-50"
    >
      <option value="">Tanpa group</option>
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
  );
}