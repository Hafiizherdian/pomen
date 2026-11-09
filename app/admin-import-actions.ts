"use server";

import type { PoolClient } from "pg";
import { withTransaction } from "@/lib/db";
import { guardWith, UserError } from "@/lib/admin-guard";
import type { ImportResult } from "@/lib/admin-types";
import {
  IMPORT_FIELDS,
  matchMember,
  planImport,
  type ImportMember,
  type RawImportRow,
} from "@/lib/import-parse";
import { isPeriode } from "@/lib/periode";

const MAX_ROWS = 1000;

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

/** Data dari browser tidak dipercaya: paksa semuanya jadi teks. */
function cleanRows(input: unknown): RawImportRow[] {
  if (!Array.isArray(input)) return [];
  return input.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    const row = { line: Number(source.line) || index + 1 } as RawImportRow;
    for (const field of IMPORT_FIELDS) row[field] = String(source[field] ?? "");
    return row;
  });
}

async function addMasterOption(client: PoolClient, kind: "jenis" | "status", value: string) {
  await client.query(
    `insert into master_options (kind, value, position)
     values ($1::text, $2::text,
       (select coalesce(max(position), -1) + 1 from master_options where kind = $1::text))
     on conflict (kind, value) do nothing`,
    [kind, value],
  );
}

export async function importProjects(input: {
  rows: RawImportRow[];
  periode: string;
  groupId: string;
  skipExisting: boolean;
}): Promise<ImportResult> {
  return guardWith(async () => {
    if (!isPeriode(input.periode)) throw new UserError("Bulan tidak valid");
    const raw = cleanRows(input.rows);
    if (raw.length === 0) throw new UserError("Tidak ada baris untuk diimpor");
    if (raw.length > MAX_ROWS) throw new UserError(`Maksimal ${MAX_ROWS} baris per impor`);
    const groupId = input.groupId || null;

    return withTransaction(async (client) => {
      const members = (
        await client.query<ImportMember>("select id, email, full_name from profiles")
      ).rows;
      const options = (
        await client.query<{ kind: string; value: string }>(
          "select kind, value from master_options order by position, created_at, id",
        )
      ).rows;

      const plan = planImport(raw, {
        members,
        jenis: options.filter((o) => o.kind === "jenis").map((o) => o.value),
        statuses: options.filter((o) => o.kind === "status").map((o) => o.value),
      });

      for (const value of plan.newJenis) await addMasterOption(client, "jenis", value);
      for (const value of plan.newStatus) await addMasterOption(client, "status", value);

      // PIC yang belum ada dibuat dengan email sementara; bisa diubah di Admin > Anggota Tim.
      const createdPics = new Map<string, string>();
      for (const name of plan.newPics) {
        const res = await client.query<{ id: string }>(
          `insert into profiles (email, full_name) values ($1, $2)
           on conflict (email) do update set email = excluded.email
           returning id`,
          [`${slugify(name)}@import.local`, name],
        );
        createdPics.set(name.toLowerCase(), res.rows[0].id);
      }
      const resolvePic = (name: string) => {
        if (!name) return null;
        return matchMember(name, members)?.id ?? createdPics.get(name.toLowerCase()) ?? null;
      };

      const existing = new Set<string>();
      if (input.skipExisting) {
        const found = await client.query<{ n: string; a: string }>(
          `select lower(name) as n, lower(coalesce(akun, '')) as a
           from projects where periode = $1`,
          [input.periode],
        );
        for (const row of found.rows) existing.add(`${row.n}|${row.a}`);
      }

      let inserted = 0;
      let skipped = 0;
      for (const row of plan.rows) {
        if (input.skipExisting) {
          const dupKey = `${row.name.toLowerCase()}|${row.akun.toLowerCase()}`;
          if (existing.has(dupKey)) {
            skipped++;
            continue;
          }
          existing.add(dupKey);
        }

        const base = slugify(row.name).slice(0, 60) || "project";
        let projectId: string | null = null;
        for (let i = 0; i < 5 && !projectId; i++) {
          const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
          const res = await client.query<{ id: string }>(
            `insert into projects
               (name, slug, group_id, pilar, jenis, tema, akun, keyword, hook, cta,
                prod_date, editor_date, selesai_date, upload_date, pic_id, status, periode)
             values ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10,
                     $11::date, $12::date, $13::date, $14::date, $15::uuid, $16, $17)
             on conflict (slug) do nothing returning id`,
            [
              row.name,
              candidate,
              groupId,
              row.pilar || null,
              row.jenis || null,
              row.tema || null,
              row.akun || null,
              row.keyword || null,
              row.hook || null,
              row.cta || null,
              row.prod_date,
              row.editor_date,
              row.selesai_date,
              row.upload_date,
              resolvePic(row.pic),
              row.status,
              input.periode,
            ],
          );
          projectId = res.rows[0]?.id ?? null;
        }
        if (!projectId) throw new UserError(`Gagal membuat slug unik untuk baris ${row.line}`);

        await client.query(
          `insert into columns (project_id, name, position)
           values ($1, 'To Do', 0), ($1, 'In Progress', 1), ($1, 'Done', 2)`,
          [projectId],
        );
        inserted++;
      }

      return {
        inserted,
        skipped,
        newPics: plan.newPics,
        newJenis: plan.newJenis,
        newStatus: plan.newStatus,
      };
    });
  });
}