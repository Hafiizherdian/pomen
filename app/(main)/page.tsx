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
        <p className="text-sm text-muted">Ringkasan semua konten</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Overview />
      </Suspense>
    </div>
  );
}

function toItems(list: ProjectStats[]) {
  return list.map(({ id, name, slug, status, is_done, overdue }) => ({
    id,
    name,
    slug,
    status,
    is_done,
    overdue,
  }));
}

async function Overview() {
  const [projects, groups] = await Promise.all([getProjectStats(), getProjectGroups()]);
  const total = projects.length;
  const done = projects.filter((p) => p.is_done).length;
  const overdue = projects.filter((p) => p.overdue).length;

  const stats = [
    { label: "Total konten", value: total },
    { label: "Selesai", value: done },
    { label: "Belum selesai", value: total - done },
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
            name: groups.length > 0 ? "Tanpa group" : "Semua konten",
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
        <h2 className="text-sm font-medium">Progres konten</h2>
        {progress.length === 0 ? (
          <p className="text-sm text-muted">
            Belum ada konten.{" "}
            <Link href="/projects" className="underline">
              Buat konten
            </Link>
          </p>
        ) : (
          <GroupProgressList groups={progress} />
        )}
      </div>
    </>
  );
}