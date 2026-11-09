import Link from "next/link";
import { Suspense } from "react";
import { GroupProgressList, type GroupProgress } from "@/app/components/group-progress";
import { getProjectGroups, getProjectStats } from "@/lib/queries";
import type { ProjectStats } from "@/lib/types";

const UNGROUPED_COLOR = "#94a3b8";

export default function Home() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Ringkasan semua project</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Overview />
      </Suspense>
    </div>
  );
}

function toItems(list: ProjectStats[]) {
  return list.map(({ id, name, slug, total, done, overdue }) => ({
    id,
    name,
    slug,
    total,
    done,
    overdue,
  }));
}

async function Overview() {
  const [projects, groups] = await Promise.all([getProjectStats(), getProjectGroups()]);
  const total = projects.reduce((n, p) => n + p.total, 0);
  const done = projects.reduce((n, p) => n + p.done, 0);
  const overdue = projects.reduce((n, p) => n + p.overdue, 0);

  const stats = [
    { label: "Project", value: projects.length },
    { label: "Total task", value: total },
    { label: "Selesai", value: done },
    { label: "Lewat tenggat", value: overdue },
  ];

  const ungrouped = projects.filter((p) => !p.group_id);
  const progress: GroupProgress[] = [
    ...groups.map((group) => ({
      id: group.id,
      name: group.name || "Tanpa nama",
      color: group.color,
      projects: toItems(projects.filter((p) => p.group_id === group.id)),
    })),
    ...(ungrouped.length > 0
      ? [
          {
            id: "none",
            name: groups.length > 0 ? "Tanpa group" : "Semua project",
            color: UNGROUPED_COLOR,
            projects: toItems(ungrouped),
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Progres project</h2>
        {progress.length === 0 ? (
          <p className="text-sm text-muted">
            Belum ada project.{" "}
            <Link href="/projects" className="underline">
              Buat project
            </Link>
          </p>
        ) : (
          <GroupProgressList groups={progress} />
        )}
      </div>
    </>
  );
}