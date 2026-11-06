import "server-only";
import { connection } from "next/server";
import { pool } from "@/lib/db";
import type { PilarAccount, PilarKind, PilarRow, PilarRows } from "@/lib/pilar-config";

export async function getPilarRows(): Promise<PilarRows> {
  await connection();
  const { rows } = await pool.query<PilarRow>(
    "select id, kind, position, account_id, data from pilar_rows order by position, created_at",
  );

  const grouped: PilarRows = { overview: [], breakdown: [], story: [], target: [] };
  for (const row of rows) grouped[row.kind as PilarKind].push(row);
  return grouped;
}

export async function getPilarAccounts(): Promise<PilarAccount[]> {
  await connection();
  const { rows } = await pool.query<PilarAccount>(
    "select id, name, position from pilar_accounts order by position, created_at",
  );
  return rows;
}

/** Daftar pilar untuk dropdown: nilai unik `pilar` dari tabel Pilar Konten dan Breakdown. */
export async function getPilarOptions(): Promise<string[]> {
  await connection();
  const { rows } = await pool.query<{ pilar: string }>(`
    select distinct trim(data->>'pilar') as pilar
    from pilar_rows
    where kind in ('overview', 'breakdown')
      and trim(coalesce(data->>'pilar', '')) <> ''
    order by 1
  `);
  return rows.map((row) => row.pilar);
}

/** Daftar akun untuk dropdown: nama akun yang sudah diisi di halaman Pilar Konten. */
export async function getAccountOptions(): Promise<string[]> {
  await connection();
  const { rows } = await pool.query<{ name: string }>(
    `select trim(name) as name
     from pilar_accounts
     where trim(name) <> ''
     order by position, created_at`,
  );
  return rows.map((row) => row.name);
}