import "server-only";
import { connection } from "next/server";
import { pool } from "@/lib/db";
import type { PilarKind, PilarRow, PilarRows } from "@/lib/pilar-config";

export async function getPilarRows(): Promise<PilarRows> {
  await connection();
  const { rows } = await pool.query<PilarRow>(
    "select id, kind, position, data from pilar_rows order by position, created_at",
  );

  const grouped: PilarRows = { overview: [], breakdown: [], story: [], target: [] };
  for (const row of rows) grouped[row.kind as PilarKind].push(row);
  return grouped;
}