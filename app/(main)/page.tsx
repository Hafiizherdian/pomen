// app/(main)/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { GroupProgressList, type GroupProgress } from "@/app/components/group-progress";
import { getDashboardCharts, getProjectGroups, getProjectStats } from "@/lib/queries";
import type { ProjectStats } from "@/lib/types";
import { getPeriodeFilter } from "@/lib/periode-filter";
import { DashboardCharts } from "@/app/components/dashboard-charts";

const UNGROUPED_COLOR = "#94a3b8";

export default function Home() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <Overview />
      </Suspense>
    </div>
  );
}

/* Skeleton loading */

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-default ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Memuat dashboard...</span>

      {/* Kartu statistik */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4">
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-7 w-14" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bar: realisasi per jenis */}
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <Bone className="h-4 w-48" />
          <div className="flex h-72 items-end gap-3 px-2">
            {[55, 85, 40, 70, 30].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col justify-end" style={{ height: `${h}%` }}>
                <Bone className="h-full rounded-b-none" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="h-4 w-full" />
            ))}
          </div>
        </section>

        {/* Donut: proporsi jenis */}
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <Bone className="h-4 w-36" />
          <div className="flex h-80 items-center justify-center">
            <div className="relative size-48 animate-pulse rounded-full bg-default">
              <div className="absolute inset-[22%] rounded-full bg-surface" />
            </div>
          </div>
        </section>

        {/* Bar: produktivitas tim */}
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <Bone className="h-4 w-40" />
          <div className="flex h-72 items-end gap-3 px-2">
            {[45, 75, 60, 35].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col justify-end" style={{ height: `${h}%` }}>
                <Bone className="h-full rounded-b-none" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="h-4 w-full" />
            ))}
          </div>
        </section>
      </div>

      {/* Progres konten */}
      <div className="space-y-3">
        <Bone className="h-4 w-28" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <Bone className="h-12 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Bone className="h-3.5 w-24" />
                  <Bone className="h-3.5 w-16" />
                </div>
                <Bone className="h-2 w-full rounded-full" />
                <Bone className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Isi dashboard */

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
  const periode = await getPeriodeFilter();
  const [projects, groups, charts] = await Promise.all([
    getProjectStats(periode),
    getProjectGroups(),
    getDashboardCharts(periode),
  ]);
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

      <DashboardCharts byJenis={charts.byJenis} byPic={charts.byPic} />

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