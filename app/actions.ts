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
  const groupId = String(formData.get("group_id") ?? "") || null;
  if (!name) throw new Error("Nama project wajib diisi");

  const base = slugify(name);

  const slug = await withTransaction(async (client) => {
    for (let i = 0; i < 5; i++) {
      const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const res = await client.query<{ id: string }>(
        `insert into projects (name, description, slug, group_id)
         values ($1, $2, $3, $4::uuid)
         on conflict (slug) do nothing returning id`,
        [name, description, candidate, groupId],
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

/* Group project */

const DEFAULT_GROUP_COLOR = "#faf2f2";

function cleanColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : DEFAULT_GROUP_COLOR;
}

export async function createProjectGroup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const color = cleanColor(String(formData.get("color") ?? ""));
  if (!name) throw new Error("Nama group wajib diisi");
  await pool.query(
    `insert into project_groups (name, color, position)
     values ($1, $2, (select coalesce(max(position), -1) + 1 from project_groups))`,
    [name, color],
  );
  refresh();
}

export async function setProjectGroupColor(id: string, color: string) {
  await pool.query("update project_groups set color = $2 where id = $1", [
    id,
    cleanColor(color),
  ]);
  refresh();
}

export async function renameProjectGroup(id: string, name: string) {
  const clean = name.trim().slice(0, 100);
  if (!clean) return;
  await pool.query("update project_groups set name = $2 where id = $1", [id, clean]);
  refresh();
}

/** Project di dalam group tidak ikut terhapus; group_id-nya jadi null (ON DELETE SET NULL). */
export async function deleteProjectGroup(id: string) {
  await pool.query("delete from project_groups where id = $1", [id]);
  refresh();
}

/** groupId kosong = tanpa group. */
export async function setProjectGroup(projectId: string, groupId: string) {
  await pool.query("update projects set group_id = $2::uuid where id = $1", [
    projectId,
    groupId || null,
  ]);
  refresh();
}

/* Edit project */

export async function renameProject(id: string, name: string) {
  const clean = name.trim().slice(0, 100);
  if (!clean) throw new Error("Nama project wajib diisi");
  await pool.query("update projects set name = $2 where id = $1", [id, clean]);
  refresh();
}

export async function updateProjectDescription(id: string, description: string) {
  await pool.query("update projects set description = $2 where id = $1", [
    id,
    description.trim().slice(0, 500) || null,
  ]);
  refresh();
}