import Link from "next/link";
import { Suspense } from "react";
import { createProject } from "@/app/actions";
import { DeleteProjectButton } from "@/app/components/delete-project-button";
import { FolderIcon } from "@/app/components/ui/folder-icon";
import {
  DeleteGroupButton,
  GroupColorPicker,
  GroupName,
  NewGroupTile,
  ProjectGroupSelect,
} from "@/app/components/project-group-controls";
import { ProjectNameInput } from "@/app/components/project-edit";
import { getProjectGroups, getProjectStats } from "@/lib/queries";
import type { ProjectGroup, ProjectStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus";

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

function ProjectCard({ project, groups }: { project: ProjectStats; groups: ProjectGroup[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1">
        <ProjectNameInput id={project.id} name={project.name} />
        <Link
          href={`/projects/${project.slug}`}
          aria-label="Buka project"
          title="Buka project"
          className="rounded-md p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
        >
          <ArrowUpRight className="size-4" />
        </Link>
        <DeleteProjectButton id={project.id} />
      </div>

      <Link href={`/projects/${project.slug}`} className="mt-1 block space-y-1 px-1">
        <p className="line-clamp-2 text-sm text-muted">
          {project.description || "Tanpa deskripsi"}
        </p>
        <p className="pt-2 text-xs text-muted tabular-nums">
          {project.done}/{project.total} task selesai
          {project.overdue > 0 && ` · ${project.overdue} lewat tenggat`}
        </p>
      </Link>

      {groups.length > 0 && (
        <div className="mt-3">
          <ProjectGroupSelect
            projectId={project.id}
            groupId={project.group_id}
            groups={groups}
          />
        </div>
      )}
    </div>
  );
}

async function ProjectsContent({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const [{ group: groupParam }, projects, groups] = await Promise.all([
    searchParams,
    getProjectStats(),
    getProjectGroups(),
  ]);

  const ungrouped = projects.filter((p) => !p.group_id);
  const selected = groups.find((g) => g.id === groupParam) ?? null;
  const showUngrouped = groupParam === "none" && !selected;

  const visible = selected
    ? projects.filter((p) => p.group_id === selected.id)
    : showUngrouped
      ? ungrouped
      : projects;

  return (
    <>
      <form
        action={createProject}
        className="grid max-w-xl gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <input name="pilar" required placeholder="Pilar Konten" className={inputClass} />
        <input name="name" required placeholder="Judul Konten" className={inputClass} />
        <input name="jenis" required placeholder="Jenis Konten" className={inputClass} />
        <input name="tema" required placeholder="Tema" className={inputClass} />
        <input name="akun" required placeholder="Akun" className={inputClass} />
        <input name="keyword" required placeholder="Fokus Keyword" className={inputClass} />
        <input name="hook" required placeholder="HOOK" className={inputClass} />
        <input name="cta" required placeholder="Call To Action" className={inputClass} />
        <input name="prod" required placeholder="Tgl Produksi" className={inputClass} />
        <input name="editor" required placeholder="Tgl masuk Editor" className={inputClass} />
        <input name="selesai" required placeholder="Tgl Selesai" className={inputClass} />
        <input name="pic" required placeholder="PIC" className={inputClass} />
        <input name="upload" required placeholder="Tgl Upload" className={inputClass} />
        <textarea
          name="description"
          rows={2}
          placeholder="Deskripsi (opsional)"
          className={inputClass}
        />
        <select
          key={selected?.id ?? ""}
          name="group_id"
          defaultValue={selected?.id ?? ""}
          className={inputClass}
          aria-label="Group"
        >
          <option value="">Tanpa group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 w-fit rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          Buat project
        </button>
      </form>

      {/* Folder group */}
      <div className="flex flex-wrap items-start gap-3">
        {groups.map((group) => (
          <FolderTile
            key={group.id}
            href={selected?.id === group.id ? "/projects" : `/projects?group=${group.id}`}
            name={group.name}
            color={group.color}
            count={projects.filter((p) => p.group_id === group.id).length}
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

      {/* Isi folder / daftar project */}
      <section className="space-y-3">
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

        {visible.length === 0 ? (
          <p className="text-sm text-muted">
            {selected ? "Belum ada project di group ini." : "Belum ada project."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((project) => (
              <ProjectCard key={project.id} project={project} groups={groups} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}