"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { PILAR_COLUMNS, type PilarKind } from "@/lib/pilar-config";

function assertKind(kind: string): asserts kind is PilarKind {
  if (!Object.hasOwn(PILAR_COLUMNS, kind)) throw new Error("Jenis tabel tidak valid");
}

function refresh() {
  revalidatePath("/pilar-content");
}

export async function addPilarRow(kind: string) {
  assertKind(kind);
  await pool.query(
    `insert into pilar_rows (kind, position)
     values ($1, (select coalesce(max(position), -1) + 1 from pilar_rows where kind = $1))`,
    [kind],
  );
  refresh();
}

export async function updatePilarCell(kind: string, id: string, field: string, value: string) {
  assertKind(kind);
  if (!PILAR_COLUMNS[kind].some((col) => col.key === field)) {
    throw new Error("Kolom tidak valid");
  }
  await pool.query(
    `update pilar_rows
     set data = jsonb_set(data, $3::text[], to_jsonb($4::text), true)
     where id = $1 and kind = $2`,
    [id, kind, [field], value.slice(0, 2000)],
  );
  refresh();
}

export async function deletePilarRow(id: string) {
  await pool.query("delete from pilar_rows where id = $1", [id]);
  refresh();
}