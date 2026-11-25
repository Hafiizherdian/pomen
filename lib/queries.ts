import "server-only";
import { connection } from "next/server";
import { pool } from "@/lib/db";
import type { Column, Profile, Project, ProjectGroup, ProjectStats, ProjectRow, ProjectWithDetails, Task } from "@/lib/types";
import type { CountRow } from "@/lib/admin-types";

export async function getProjects(periode = "") {
  await connection();
  const { rows } = await pool.query<Project & { akun: string | null }>(
    `select id, name, description, slug, group_id, akun, created_at
     from projects
     where ($1::text = '' or periode like $1::text || '%')
     order by created_at`,
    [periode],
  );
  return rows;
}

export async function getProjectGroups() {
  await connection();
  const { rows } = await pool.query<ProjectGroup>(
    "select id, name, color, position from project_groups order by position, created_at",
  );
  return rows;
}

export async function getProjectStats(periode = "") {
  await connection();
  const { rows } = await pool.query<ProjectStats>(
    `select p.id, p.name, p.slug, p.group_id, p.akun, p.status, p.periode, p.upload_date,
            coalesce(o.is_final, false) as is_done,
            (not coalesce(o.is_final, false)
              and p.upload_date < (now() at time zone 'Asia/Jakarta')::date) as overdue
     from projects p
     left join master_options o on o.kind = 'status' and o.value = p.status
     where ($1::text = '' or p.periode like $1::text || '%')
     order by p.created_at`,
    [periode],
  );
  return rows;
}

export async function getProjectBySlug(slug: string) {
  await connection();
  const { rows } = await pool.query<ProjectWithDetails>(
    `select p.id, p.name, p.description, p.slug, p.group_id, p.created_at,
            p.pilar, p.jenis, p.tema, p.akun, p.keyword, p.hook, p.cta,
            p.prod_date, p.editor_date, p.selesai_date, p.upload_date, p.pic_id,
            pr.full_name as pic_name, pr.email as pic_email
     from projects p
     left join profiles pr on pr.id = p.pic_id
     where p.slug = $1`,
    [slug],
  );
  return rows[0] ?? null;
}

export async function getProjectRows(periode = "") {
  await connection();
  const { rows } = await pool.query<ProjectRow>(
    `select p.id, p.name, p.slug, p.group_id, p.pilar, p.jenis, p.tema, p.akun,
            p.keyword, p.hook, p.cta, p.prod_date, p.editor_date, p.selesai_date,
            p.upload_date, p.status, p.periode, p.pic_id,
            pr.full_name as pic_name, pr.email as pic_email
     from projects p
     left join profiles pr on pr.id = p.pic_id
     where ($1::text = '' or p.periode like $1::text || '%')
     order by p.created_at`,
    [periode],
  );
  return rows;
}

/** Tahun yang ada di data, untuk dropdown filter. */
export async function getPeriodeYears() {
  await connection();
  const { rows } = await pool.query<{ year: string }>(
    "select distinct left(periode, 4) as year from projects where periode is not null order by 1 desc",
  );
  return rows.map((r) => r.year);
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

const PERIODE_WHERE = "($1::text = '' or p.periode like $1::text || '%')";

export async function getDashboardCharts(periode = "") {
  await connection();

  const [jenis, pic] = await Promise.all([
    pool.query<CountRow>(
      `select coalesce(nullif(trim(p.jenis), ''), '(belum diisi)') as label,
              count(*)::int as total,
              count(*) filter (where coalesce(o.is_final, false))::int as done
       from projects p
       left join master_options o on o.kind = 'status' and o.value = p.status
       where ${PERIODE_WHERE}
       group by 1
       order by total desc, label`,
      [periode],
    ),
    pool.query<CountRow>(
      `select coalesce(nullif(trim(pr.full_name), ''), pr.email) as label,
              count(*)::int as total,
              count(*) filter (where coalesce(o.is_final, false))::int as done
       from projects p
       join profiles pr on pr.id = p.pic_id
       left join master_options o on o.kind = 'status' and o.value = p.status
       where ${PERIODE_WHERE}
       group by pr.id, 1
       order by done desc, total desc, label`,
      [periode],
    ),
  ]);

  return { byJenis: jenis.rows, byPic: pic.rows };
}