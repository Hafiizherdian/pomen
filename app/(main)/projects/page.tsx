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
import { getMasterOptions } from "@/lib/master-queries";
import { currentPeriode, formatPeriode, isPeriode } from "@/lib/periode";
import { cn } from "@/lib/utils";

const UNGROUPED_COLOR = "#94a3b8";

type SearchParams = Promise<{ group?: string; bulan?: string }>;

function projectsHref(group: string | null, bulan: string | null) {
  const params = new URLSearchParams();
  if (group) params.set("group", group);
  if (bulan) params.set("bulan", bulan);
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

export default function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex-1 min-w-0 space-y-6 p-6">
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

function MonthChips({
  months,
  current,
  group,
}: {
  months: string[];
  current: string | null;
  group: string | null;
}) {
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-sm transition-colors",
      active
        ? "border-accent bg-accent text-accent-foreground"
        : "border-border text-muted hover:bg-default hover:text-foreground",
    );

  return (
    <nav aria-label="Filter bulan" className="flex flex-wrap items-center gap-2">
      <Link
        href={projectsHref(group, null)}
        aria-current={current === null ? "true" : undefined}
        className={chip(current === null)}
      >
        Semua bulan
      </Link>
      {months.map((month) => (
        <Link
          key={month}
          href={projectsHref(group, month)}
          aria-current={current === month ? "true" : undefined}
          className={chip(current === month)}
        >
          {formatPeriode(month)}
        </Link>
      ))}
    </nav>
  );
}

async function ProjectsContent({ searchParams }: { searchParams: SearchParams }) {
  const [
    { group: groupParam, bulan: bulanParam },
    groups,
    profiles,
    pilarOptions,
    accountOptions,
    rows,
    master,
  ] = await Promise.all([
    searchParams,
    getProjectGroups(),
    getProfiles(),
    getPilarOptions(),
    getAccountOptions(),
    getProjectRows(),
    getMasterOptions(),
  ]);

  const thisMonth = currentPeriode();
  const bulan = isPeriode(bulanParam) ? bulanParam : null;

  // Daftar bulan: yang ada di data, bulan berjalan, dan bulan yang sedang dipilih.
  const monthSet = new Set<string>([thisMonth]);
  for (const row of rows) if (row.periode) monthSet.add(row.periode);
  if (bulan) monthSet.add(bulan);
  const months = [...monthSet].sort().reverse();

  const scoped = bulan ? rows.filter((r) => r.periode === bulan) : rows;
  const ungrouped = scoped.filter((r) => !r.group_id);
  const selected = groups.find((g) => g.id === groupParam) ?? null;
  const showUngrouped = groupParam === "none" && !selected;

  const visible = selected
    ? scoped.filter((r) => r.group_id === selected.id)
    : showUngrouped
      ? ungrouped
      : scoped;

  return (
    <>
      <MonthChips months={months} current={bulan} group={selected?.id ?? (showUngrouped ? "none" : null)} />

      {/* Folder group */}
      <div className="flex flex-wrap items-start ">
        {groups.map((group) => (
          <FolderTile
            key={group.id}
            href={projectsHref(selected?.id === group.id ? null : group.id, bulan)}
            name={group.name}
            color={group.color}
            count={scoped.filter((r) => r.group_id === group.id).length}
            selected={selected?.id === group.id}
          />
        ))}
        {groups.length > 0 && ungrouped.length > 0 && (
          <FolderTile
            href={projectsHref(showUngrouped ? null : "none", bulan)}
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
              {bulan ? ` · ${formatPeriode(bulan)}` : ""}
            </h2>
          )}

          <NewProjectDialog
            pilarOptions={pilarOptions}
            accountOptions={accountOptions}
            profiles={profiles}
            groups={groups}
            defaultGroupId={selected?.id ?? ""}
            statusOptions={master.statuses}
            jenisOptions={master.jenis}
            defaultPeriode={bulan ?? thisMonth}
          />
        </div>

        <ProjectTable
          rows={visible}
          groups={groups}
          profiles={profiles}
          pilarOptions={pilarOptions}
          accountOptions={accountOptions}
          statusValues={master.statuses}
          jenisValues={master.jenis}
          doneStatuses={master.doneStatuses}
        />
      </section>
    </>
  );
}