import "server-only";
import { connection } from "next/server";
import { pool } from "@/lib/db";
import type { MasterKind, MasterOption } from "@/lib/admin-types";

export async function getMasterOptionRows(): Promise<MasterOption[]> {
  await connection();
  const { rows } = await pool.query<MasterOption>(
    `select id, kind, value, position, is_final
     from master_options
     order by kind, position, created_at, id`,
  );
  return rows;
}

/** Pilihan untuk dropdown di halaman Project. */
export async function getMasterOptions() {
  const rows = await getMasterOptionRows();
  const status = rows.filter((r) => r.kind === "status");
  return {
    statuses: status.map((r) => r.value),
    doneStatuses: status.filter((r) => r.is_final).map((r) => r.value),
    jenis: rows.filter((r) => r.kind === "jenis").map((r) => r.value),
  };
}

/** Untuk validasi di server action (tanpa connection(), aman dipanggil dari action). */
export async function listOptionValues(kind: MasterKind): Promise<string[]> {
  const { rows } = await pool.query<{ value: string }>(
    "select value from master_options where kind = $1 order by position, created_at, id",
    [kind],
  );
  return rows.map((r) => r.value);
}