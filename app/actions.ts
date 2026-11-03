"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pool, withTransaction } from "@/lib/db";
import type { TaskInput } from "@/lib/types";

const PRIORITIES = ["low", "medium", "high"];

function refresh() {
  revalidatePath("/", "layout");
}

function cleanTask(input: TaskInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Judul task wajib diisi");
  return {
    title,
    description: input.description.trim() || null,
    priority: PRIORITIES.includes(input.priority) ? input.priority : "medium",
    due_date: input.due_date || null,
    assigned_to: input.assigned_to || null,
  };
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

/* Project */

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Nama project wajib diisi");

  const base = slugify(name);

  const slug = await withTransaction(async (client) => {
    for (let i = 0; i < 5; i++) {
      const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const res = await client.query<{ id: string }>(
        `insert into projects (name, description, slug) values ($1, $2, $3)
         on conflict (slug) do nothing returning id`,
        [name, description, candidate],
      );
      if (res.rowCount) {
        await client.query(
          `insert into columns (project_id, name, position)
           values ($1, 'To Do', 0), ($1, 'In Progress', 1), ($1, 'Done', 2)`,
          [res.rows[0].id],
        );
        return candidate;
      }
    }
    throw new Error("Gagal membuat slug unik");
  });

  refresh();
  redirect(`/projects/${slug}`);
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await pool.query("delete from projects where id = $1", [id]);
  refresh();
}

/* Kolom */

export async function createColumn(projectId: string, name: string) {
  const clean = name.trim();
  if (!clean) return;
  await pool.query(
    `insert into columns (project_id, name, position)
     values ($1, $2, (select coalesce(max(position), -1) + 1 from columns where project_id = $1))`,
    [projectId, clean],
  );
  refresh();
}

export async function renameColumn(id: string, name: string) {
  const clean = name.trim();
  if (!clean) return;
  await pool.query("update columns set name = $2 where id = $1", [id, clean]);
  refresh();
}

export async function deleteColumn(id: string) {
  await pool.query("delete from columns where id = $1", [id]);
  refresh();
}

/* Task */

export async function createTask(columnId: string, input: TaskInput) {
  const t = cleanTask(input);
  await pool.query(
    `insert into tasks (column_id, title, description, priority, due_date, assigned_to, position)
     values ($1, $2, $3, $4, $5, $6,
       (select coalesce(max(position), -1) + 1 from tasks where column_id = $1))`,
    [columnId, t.title, t.description, t.priority, t.due_date, t.assigned_to],
  );
  refresh();
}

export async function updateTask(id: string, input: TaskInput) {
  const t = cleanTask(input);
  await pool.query(
    `update tasks
     set title = $2, description = $3, priority = $4, due_date = $5,
         assigned_to = $6, updated_at = now()
     where id = $1`,
    [id, t.title, t.description, t.priority, t.due_date, t.assigned_to],
  );
  refresh();
}

export async function toggleTaskDone(id: string, isDone: boolean) {
  await pool.query("update tasks set is_done = $2, updated_at = now() where id = $1", [id, isDone]);
  refresh();
}

export async function deleteTask(id: string) {
  await pool.query("delete from tasks where id = $1", [id]);
  refresh();
}

/** Simpan urutan akhir task di kolom yang terdampak drag & drop. */
export async function reorderTasks(updates: { columnId: string; taskIds: string[] }[]) {
  await withTransaction(async (client) => {
    for (const { columnId, taskIds } of updates) {
      if (taskIds.length === 0) continue;
      await client.query(
        `update tasks t
         set column_id = $1, position = v.pos, updated_at = now()
         from unnest($2::uuid[], $3::int[]) as v(id, pos)
         where t.id = v.id`,
        [columnId, taskIds, taskIds.map((_, i) => i)],
      );
    }
  });
  refresh();
}