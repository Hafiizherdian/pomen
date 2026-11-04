"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { PILAR_COLUMNS, PILAR_PER_ACCOUNT, type PilarKind } from "@/lib/pilar-config";

function assertKind(kind: string): asserts kind is PilarKind {
  if (!Object.hasOwn(PILAR_COLUMNS, kind)) throw new Error("Jenis tabel tidak valid");
}

function refresh() {
  revalidatePath("/pilar");
}

/* Baris tabel */

export async function addPilarRow(kind: string, accountId?: string) {
  assertKind(kind);
  const perAccount = PILAR_PER_ACCOUNT.includes(kind);
  if (perAccount && !accountId) throw new Error("Akun wajib dipilih");
  const account = perAccount ? (accountId ?? null) : null;

  await pool.query(
    `insert into pilar_rows (kind, account_id, position)
     values ($1::text, $2::uuid,
       (select coalesce(max(position), -1) + 1
        from pilar_rows
        where kind = $1::text and account_id is not distinct from $2::uuid))`,
    [kind, account],
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

/* Akun */

export async function addPilarAccount() {
  await pool.query(
    `insert into pilar_accounts (name, position)
     values ('', (select coalesce(max(position), -1) + 1 from pilar_accounts))`,
  );
  refresh();
}

export async function updatePilarAccount(id: string, value: string) {
  const clean = value.trim().replace(/^@+/, "").slice(0, 100);
  await pool.query("update pilar_accounts set name = $2 where id = $1", [id, clean]);
  refresh();
}

/** Menghapus akun juga menghapus semua baris breakdown miliknya (ON DELETE CASCADE). */
export async function deletePilarAccount(id: string) {
  await pool.query("delete from pilar_accounts where id = $1", [id]);
  refresh();
}