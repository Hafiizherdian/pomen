import { Suspense } from "react";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/app/components/ui/kanban-board";
import { getBoard, getProfiles, getProjectBySlug } from "@/lib/queries";
import { Plus } from "lucide-react";
import { addColumnAction } from "@/app/actions";
import { ProjectStatusSelect } from "@/app/components/project/project-status-select";
import { getMasterOptions } from "@/lib/master-queries";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus";

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="flex-1 space-y-4 p-6">
      <Suspense fallback={<p className="text-sm text-muted">Memuat board...</p>}>
        <Board params={params} />
      </Suspense>
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function Board({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [columns, profiles, master] = await Promise.all([
    getBoard(project.id),
    getProfiles(),
    getMasterOptions(),
  ]);

  const details: [string, string | null][] = [
    ["Pilar Konten", project.pilar],
    ["Jenis Konten", project.jenis],
    ["Tema", project.tema],
    ["Akun", project.akun],
    ["Fokus Keyword", project.keyword],
    ["HOOK", project.hook],
    ["Call To Action", project.cta],
    ["PIC", project.pic_name || project.pic_email],
    ["Tgl Produksi", formatDate(project.prod_date)],
    ["Tgl Masuk Editor", formatDate(project.editor_date)],
    ["Tgl Selesai", formatDate(project.selesai_date)],
    ["Tgl Upload", formatDate(project.upload_date)],
  ];
  const filled = details.filter(([, value]) => value);

  return (
    <>
    <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description && <p className="text-sm text-muted">{project.description}</p>}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <ProjectStatusSelect
            id={project.id}
            status={project.status}
            statuses={master.statuses}
            className={master.statusClasses[project.status]}
          />

          <form
            action={addColumnAction.bind(null, project.id)}
            className="flex min-w-0 flex-1 gap-2 sm:w-72 sm:flex-none"
          >
            <input
              name="name"
              required
              placeholder="Board baru..."
              aria-label="Nama Board baru"
              className={inputClass}
            />
            <button
              type="submit"
              aria-label="Tambah kolom"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
            >
              <Plus className="size-4" />
            </button>
          </form>
        </div>
      </div>

      {filled.length > 0 && (
        <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-border bg-surface p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {filled.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <KanbanBoard projectId={project.id} columns={columns} profiles={profiles} />
    </>
  );
}