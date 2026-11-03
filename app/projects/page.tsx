import Link from "next/link";
import { Suspense } from "react";
import { createProject } from "@/app/actions";
import { DeleteProjectButton } from "@/app/components/delete-project-button";
import { getProjectStats } from "@/lib/queries";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus";

export default function ProjectsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Project</h1>
        {/* <p className="text-sm text-muted">Pilih project atau buat yang baru</p> */}
      </div>

      <form
        action={createProject}
        className="grid max-w-xl gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <input name="name" required placeholder="Nama project" className={inputClass} />
        <textarea
          name="description"
          rows={2}
          placeholder="Deskripsi (opsional)"
          className={inputClass}
        />
        <button
          type="submit"
          className="h-9 w-fit rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          Buat project
        </button>
      </form>

      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <ProjectList />
      </Suspense>
    </div>
  );
}

async function ProjectList() {
  const projects = await getProjectStats();

  if (projects.length === 0) {
    return <p className="text-sm text-muted">Belum ada project.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <div key={p.id} className="relative rounded-xl border border-border bg-surface p-4">
          <Link href={`/projects/${p.slug}`} className="block space-y-1 pr-8">
            <h3 className="font-medium">{p.name}</h3>
            <p className="line-clamp-2 text-sm text-muted">{p.description || "Tanpa deskripsi"}</p>
            <p className="pt-2 text-xs text-muted tabular-nums">
              {p.done}/{p.total} task selesai
              {p.overdue > 0 && ` · ${p.overdue} lewat tenggat`}
            </p>
          </Link>
          <div className="absolute right-3 top-3">
            <DeleteProjectButton id={p.id} />
          </div>
        </div>
      ))}
    </div>
  );
}