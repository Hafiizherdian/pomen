import "server-only";
import { connection } from "next/server";
import { pool } from "@/lib/db";
import type {
  AdminCounts,
  AkunRow,
  CountRow,
  MemberRow,
  OptionRow,
  Report,
  ReportRange,
} from "@/lib/admin-types";

/* Ringkasan */

export async function getAdminCounts(): Promise<AdminCounts> {
  await connection();
  const { rows } = await pool.query<AdminCounts>(`
    select
      (select count(*)::int from profiles) as members,
      (select count(*)::int from projects) as projects,
      (select count(*)::int from project_groups) as groups,
      (select count(*)::int from master_options where kind = 'status') as statuses,
      (select count(*)::int from master_options where kind = 'jenis') as jenis
  `);
  return rows[0];
}

/* Anggota tim */

export async function getMembers(): Promise<MemberRow[]> {
  await connection();
  const { rows } = await pool.query<MemberRow>(`
    select pr.id, pr.email, pr.full_name, pr.created_at,
           (select count(*)::int from projects p where p.pic_id = pr.id) as project_count,
           (select count(*)::int from tasks t where t.assigned_to = pr.id) as task_count
    from profiles pr
    order by pr.full_name nulls last, pr.email
  `);
  return rows;
}

/* Master data */

export async function getOptionsWithUsage(): Promise<OptionRow[]> {
  await connection();
  const { rows } = await pool.query<OptionRow>(`
    select o.id, o.kind, o.value, o.position, o.is_final,
           case o.kind
             when 'status' then (select count(*)::int from projects p where p.status = o.value)
             else (select count(*)::int from projects p where p.jenis = o.value)
           end as usage
    from master_options o
    order by o.kind, o.position, o.created_at, o.id
  `);
  return rows;
}

/* Laporan */

const DATE_FILTER = `($1::date is null or p.prod_date >= $1::date)
  and ($2::date is null or p.prod_date <= $2::date)`;

async function getBounds(range: ReportRange): Promise<{ from: string | null; to: string | null }> {
  if (range === "semua") return { from: null, to: null };

  // Hari pertama pekan (Senin) / bulan berjalan menurut waktu Jakarta.
  const sql =
    range === "minggu"
      ? `select d::date as "from", d::date + 6 as "to"
         from (select date_trunc('week', now() at time zone 'Asia/Jakarta') as d) x`
      : `select d::date as "from", (d + interval '1 month')::date - 1 as "to"
         from (select date_trunc('month', now() at time zone 'Asia/Jakarta') as d) x`;
  const { rows } = await pool.query<{ from: string; to: string }>(sql);
  return rows[0];
}

export async function getReport(
  range: ReportRange,
  statuses: string[],
  doneStatuses: string[],
): Promise<Report> {
  await connection();
  const { from, to } = await getBounds(range);

  // $1 selalu daftar status selesai; filter periode memakai parameter berikutnya.
  const filter =
    range === "minggu"
      ? { sql: "p.prod_date between $2::date and $3::date", params: [from, to] }
      : range === "bulan"
        ? { sql: "p.periode = to_char($2::date, 'YYYY-MM')", params: [from] }
        : { sql: "true", params: [] as (string | null)[] };
  const params = [doneStatuses, ...filter.params];

  const countBy = (labelExpr: string, join = "") =>
    pool.query<CountRow>(
      `select ${labelExpr} as label,
              count(*)::int as total,
              count(*) filter (where p.status = any($1::text[]))::int as done
       from projects p ${join}
       where ${filter.sql}
       group by 1
       order by total desc, label`,
      params,
    );

  const [status, akun, pilar, pic, jenis, targets] = await Promise.all([
    countBy("coalesce(p.status, '-')"),
    countBy("coalesce(nullif(trim(p.akun), ''), '(tanpa akun)')"),
    countBy("coalesce(nullif(trim(p.pilar), ''), '(tanpa pilar)')"),
    countBy(
      "coalesce(nullif(trim(pr.full_name), ''), pr.email, '(belum ditentukan)')",
      "left join profiles pr on pr.id = p.pic_id",
    ),
    countBy("coalesce(nullif(trim(p.jenis), ''), '(belum diisi)')"),
    // Target produksi / minggu: angka pertama di kolom "Target Produksi / Minggu", dijumlah per akun.
    range === "minggu"
      ? pool.query<{ akun: string; target: number }>(`
          select trim(a.name) as akun,
                 coalesce(sum(coalesce(nullif(substring(r.data->>'target' from '[0-9]+'), '')::int, 0)), 0)::int as target
          from pilar_accounts a
          left join pilar_rows r on r.account_id = a.id and r.kind = 'breakdown'
          where trim(a.name) <> ''
          group by trim(a.name)
        `)
      : Promise.resolve({ rows: [] as { akun: string; target: number }[] }),
  ]);

  const order = new Map(statuses.map((s, i) => [s, i]));
  const byStatus = [...status.rows].sort(
    (a, b) => (order.get(a.label) ?? 999) - (order.get(b.label) ?? 999),
  );

  const targetMap = new Map(targets.rows.map((r) => [r.akun, r.target]));
  const byAkun: AkunRow[] = akun.rows.map((r) => ({
    ...r,
    target: range === "minggu" ? (targetMap.get(r.label) ?? null) : null,
  }));
  if (range === "minggu") {
    // Akun yang punya target tapi belum ada konten minggu ini tetap ditampilkan.
    for (const [name, target] of targetMap) {
      if (!byAkun.some((a) => a.label === name)) {
        byAkun.push({ label: name, total: 0, done: 0, target });
      }
    }
    byAkun.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }

  return {
    range,
    from,
    to,
    total: byStatus.reduce((n, r) => n + r.total, 0),
    done: byStatus
      .filter((r) => doneStatuses.includes(r.label))
      .reduce((n, r) => n + r.total, 0),
    targetTotal:
      range === "minggu" ? [...targetMap.values()].reduce((n, t) => n + t, 0) : null,
    byStatus,
    byAkun,
    byPilar: pilar.rows,
    byPic: pic.rows,
    byJenis: jenis.rows,
  };
}