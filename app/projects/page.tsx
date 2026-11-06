import Link from "next/link";
import { Suspense } from "react";
import { FolderIcon } from "@/app/components/ui/folder-icon";
import {
  DeleteGroupButton,
  GroupColorPicker,
  GroupName,
  NewGroupTile,
} from "@/app/components/project/project-group-controls";
import { NewProjectDialog } from "@/app/components/project/project-dialog";
import { ProjectTable } from "@/app/components/project/project-table";
import { getProfiles, getProjectGroups, getProjectRows } from "@/lib/queries";
import { getAccountOptions, getPilarOptions } from "@/lib/pilar-queries";
import { cn } from "@/lib/utils";

const UNGROUPED_COLOR = "#94a3b8";

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Project</h1>
      </div>

      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <ProjectsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function FolderTile({
  href,
  name,
  color,
  count,
  selected,
}: {
  href: string;
  name: string;
  color: string;
  count: number;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group flex w-32 flex-col items-center gap-1 rounded-xl p-2 transition-colors hover:bg-default/60",
        selected && "bg-default/80 ring-2 ring-focus",
      )}
    >
      <FolderIcon
        color={color}
        className="w-full transition-transform group-hover:-translate-y-0.5"
      />
      <span className="w-full truncate text-center text-sm font-medium">
        {name || "Tanpa nama"}
      </span>
      <span className="text-xs tabular-nums text-muted">{count} project</span>
    </Link>
  );
}

async function ProjectsContent({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const [{ group: groupParam }, groups, profiles, pilarOptions, accountOptions, rows] =
    await Promise.all([
      searchParams,
      getProjectGroups(),
      getProfiles(),
      getPilarOptions(),
      getAccountOptions(),
      getProjectRows(),
    ]);

  const ungrouped = rows.filter((r) => !r.group_id);
  const selected = groups.find((g) => g.id === groupParam) ?? null;
  const showUngrouped = groupParam === "none" && !selected;

  const visible = selected
    ? rows.filter((r) => r.group_id === selected.id)
    : showUngrouped
      ? ungrouped
      : rows;

  return (
    <>
      {/* Folder group */}
      <div className="flex flex-wrap items-start ">
        {groups.map((group) => (
          <FolderTile
            key={group.id}
            href={selected?.id === group.id ? "/projects" : `/projects?group=${group.id}`}
            name={group.name}
            color={group.color}
            count={rows.filter((r) => r.group_id === group.id).length}
            selected={selected?.id === group.id}
          />
        ))}
        {groups.length > 0 && ungrouped.length > 0 && (
          <FolderTile
            href={showUngrouped ? "/projects" : "/projects?group=none"}
            name="Tanpa group"
            color={UNGROUPED_COLOR}
            count={ungrouped.length}
            selected={showUngrouped}
          />
        )}
        <NewGroupTile />
      </div>

      {/* Isi folder / tabel project */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {selected ? (
            <div className="flex flex-wrap items-center gap-3">
              <GroupName id={selected.id} name={selected.name} />
              <span className="rounded-full bg-default px-2 py-0.5 text-xs tabular-nums text-muted">
                {visible.length}
              </span>
              <GroupColorPicker
                key={`${selected.id}:${selected.color}`}
                id={selected.id}
                color={selected.color}
              />
              <DeleteGroupButton id={selected.id} name={selected.name} />
            </div>
          ) : (
            <h2 className="px-1 text-base font-semibold">
              {showUngrouped ? "Tanpa group" : "Semua project"}
            </h2>
          )}

          <NewProjectDialog
            pilarOptions={pilarOptions}
            accountOptions={accountOptions}
            profiles={profiles}
            groups={groups}
            defaultGroupId={selected?.id ?? ""}
          />
        </div>

        <ProjectTable
          rows={visible}
          groups={groups}
          profiles={profiles}
          pilarOptions={pilarOptions}
          accountOptions={accountOptions}
        />
      </section>
    </>
  );
}