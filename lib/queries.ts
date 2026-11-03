import "server-only";
import { connection } from "next/server";
import { pool } from "@/lib/db";
import type { Column, Profile, Project, ProjectStats, Task } from "@/lib/types";

export async function getProjects() {
  await connection();
  const { rows } = await pool.query<Project>(
    "select id, name, description, slug, created_at from projects order by created_at",
  );
  return rows;
}

export async function getProjectStats() {
  await connection();
  const { rows } = await pool.query<ProjectStats>(`
    select p.id, p.name, p.description, p.slug, p.created_at,
           count(t.id)::int as total,
           count(t.id) filter (where t.is_done)::int as done,
           count(t.id) filter (where not t.is_done and t.due_date < current_date)::int as overdue
    from projects p
    left join columns c on c.project_id = p.id
    left join tasks t on t.column_id = c.id
    group by p.id
    order by p.created_at
  `);
  return rows;
}

export async function getProjectBySlug(slug: string) {
  await connection();
  const { rows } = await pool.query<Project>(
    "select id, name, description, slug, created_at from projects where slug = $1",
    [slug],
  );
  return rows[0] ?? null;
}

export async function getBoard(projectId: string): Promise<Column[]> {
  await connection();
  const [cols, tasks] = await Promise.all([
    pool.query<Omit<Column, "tasks">>(
      "select id, name, position from columns where project_id = $1 order by position, created_at",
      [projectId],
    ),
    pool.query<Task>(
      `select t.* from tasks t
       join columns c on c.id = t.column_id
       where c.project_id = $1
       order by t.position, t.created_at`,
      [projectId],
    ),
  ]);

  return cols.rows.map((col) => ({
    ...col,
    tasks: tasks.rows.filter((t) => t.column_id === col.id),
  }));
}

export async function getProfiles() {
  await connection();
  const { rows } = await pool.query<Profile>(
    "select id, email, full_name from profiles order by full_name nulls last, email",
  );
  return rows;
}