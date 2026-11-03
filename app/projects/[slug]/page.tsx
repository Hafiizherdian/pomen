import { Suspense } from "react";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/app/components/kanban-board";
import { getBoard, getProfiles, getProjectBySlug } from "@/lib/queries";

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="flex-1 space-y-4 p-6">
      <Suspense fallback={<p className="text-sm text-muted">Memuat board...</p>}>
        <Board params={params} />
      </Suspense>
    </div>
  );
}

async function Board({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [columns, profiles] = await Promise.all([getBoard(project.id), getProfiles()]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        {project.description && <p className="text-sm text-muted">{project.description}</p>}
      </div>
      <KanbanBoard projectId={project.id} columns={columns} profiles={profiles} />
    </>
  );
}