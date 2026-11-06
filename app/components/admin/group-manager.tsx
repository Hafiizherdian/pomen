"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { moveGroup, moveProjectsToGroup } from "@/app/admin-actions";
import { IconButton, StatusLine } from "@/app/components/admin/admin-ui";
import { useAdminAction } from "@/app/components/admin/use-admin-action";
import {
  DeleteGroupButton,
  GroupColorPicker,
  GroupName,
  NewGroupTile,
} from "@/app/components/project/project-group-controls";
import { FolderIcon } from "@/app/components/ui/folder-icon";
import type { GroupProject } from "@/lib/admin-types";
import type { ProjectGroup } from "@/lib/types";

const selectClass =
  "h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-focus";

export function GroupManager({
  groups,
  projects,
}: {
  groups: ProjectGroup[];
  projects: GroupProject[];
}) {
  const { pending, error, run } = useAdminAction();
  const [filter, setFilter] = useState("all"); // "all" | "none" | id group
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState(""); // "" = tanpa group

  const groupName = new Map(groups.map((g) => [g.id, g.name || "Tanpa nama"]));
  const countOf = (groupId: string) => projects.filter((p) => p.group_id === groupId).length;

  const visible = projects.filter((p) =>
    filter === "all" ? true : filter === "none" ? !p.group_id : p.group_id === filter,
  );
  const allChecked = visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function handleMove() {
    const ok = await run(() => moveProjectsToGroup([...selected], target));
    if (ok) setSelected(new Set());
  }

  return (
    <div className="space-y-8">
      <StatusLine
        pending={pending}
        error={error}
        hint="Urutan group menentukan urutannya di Dashboard, sidebar, dan halaman Project."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Urutan dan tampilan group</h2>
        <ul className="space-y-2">
          {groups.length === 0 && <li className="text-sm text-muted">Belum ada group.</li>}
          {groups.map((group, index) => (
            <li
              key={group.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex flex-col">
                <IconButton
                  label="Naikkan group"
                  disabled={index === 0}
                  onClick={() => run(() => moveGroup(group.id, "up"))}
                >
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton
                  label="Turunkan group"
                  disabled={index === groups.length - 1}
                  onClick={() => run(() => moveGroup(group.id, "down"))}
                >
                  <ArrowDown className="size-4" />
                </IconButton>
              </div>
              <FolderIcon color={group.color} className="w-10 shrink-0" />
              <GroupName id={group.id} name={group.name} />
              <span className="rounded-full bg-default px-2 py-0.5 text-xs tabular-nums text-muted">
                {countOf(group.id)} project
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                <GroupColorPicker
                  key={`${group.id}:${group.color}`}
                  id={group.id}
                  color={group.color}
                />
                <DeleteGroupButton id={group.id} name={group.name} />
              </div>
            </li>
          ))}
        </ul>
        <NewGroupTile />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Pindahkan project</h2>
            <p className="text-xs text-muted">
              Centang beberapa project, pilih group tujuan, lalu pindahkan sekaligus.
            </p>
          </div>
          <label className="grid gap-1 text-xs font-medium text-muted">
            <span>Tampilkan</span>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setSelected(new Set());
              }}
              className={selectClass}
            >
              <option value="all">Semua project</option>
              <option value="none">Tanpa group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name || "Tanpa nama"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <span className="text-sm tabular-nums text-muted">{selected.size} dipilih</span>
          <span className="text-sm text-muted">pindahkan ke</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Group tujuan"
            className={selectClass}
          >
            <option value="">Tanpa group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name || "Tanpa nama"}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={handleMove}
            className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            Pindahkan
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead className="bg-default/60 text-left">
              <tr>
                <th className="w-10 border-b border-border px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua yang tampil"
                    checked={allChecked}
                    onChange={toggleAll}
                  />
                </th>
                <th className="border-b border-border px-3 py-2.5 font-semibold">Judul Konten</th>
                <th className="border-b border-border px-3 py-2.5 font-semibold">Akun</th>
                <th className="border-b border-border px-3 py-2.5 font-semibold">Group</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    Tidak ada project di tampilan ini.
                  </td>
                </tr>
              ) : (
                visible.map((project) => (
                  <tr key={project.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${project.name}`}
                        checked={selected.has(project.id)}
                        onChange={() => toggle(project.id)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{project.name}</td>
                    <td className="px-3 py-2 text-muted">{project.akun || "-"}</td>
                    <td className="px-3 py-2 text-muted">
                      {project.group_id ? (groupName.get(project.group_id) ?? "-") : "Tanpa group"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}