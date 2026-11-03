import Link from "next/link";
import { Suspense } from "react";
import { getProjectStats } from "@/lib/queries";

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

async function Overview() {
  const projects = await getProjectStats();
  const total = projects.reduce((n, p) => n + p.total, 0);
  const done = projects.reduce((n, p) => n + p.done, 0);
  const overdue = projects.reduce((n, p) => n + p.overdue, 0);

  const stats = [
    { label: "Project", value: projects.length },
    { label: "Total task", value: total },
    { label: "Selesai", value: done },
    { label: "Lewat tenggat", value: overdue },
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
        {projects.length === 0 && (
          <p className="text-sm text-muted">
            Belum ada project.{" "}
            <Link href="/projects" className="underline">
              Buat project
            </Link>
          </p>
        )}
        {projects.map((p) => {
          const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-default"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted tabular-nums">
                  {p.done}/{p.total} selesai
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-default">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}