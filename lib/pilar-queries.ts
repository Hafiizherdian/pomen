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