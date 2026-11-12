"use server";

import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import { pool, withTransaction } from "@/lib/db";
import { assertAdmin, assertRole } from "@/lib/admin-auth";
import type { ActionResult, MasterKind } from "@/lib/admin-types";
import type { Role } from "@/lib/roles";

/* Util */

/** Error yang pesannya aman ditampilkan ke admin. Error lain dijadikan pesan umum. */
class UserError extends Error {}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}

/** Cek admin, jalankan, revalidate, dan ubah error jadi hasil yang bisa ditampilkan. */
async function guard(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await assertAdmin();
    await fn();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
  }
}

function swapped(ids: string[], id: string, direction: string) {
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : direction === "down" ? i + 1 : -1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

async function renumber(
  client: PoolClient,
  table: "master_options" | "project_groups",
  ids: string[],
) {
  await client.query(
    `update ${table} t
     set position = v.pos
     from unnest($1::uuid[], $2::int[]) as v(id, pos)
     where t.id = v.id`,
    [ids, ids.map((_, i) => i)],
  );
}

/* Anggota tim */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanMember(input: { email: string; full_name: string }) {
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) throw new UserError("Format email tidak valid");
  return {
    email,
    full_name: String(input.full_name ?? "").trim().slice(0, 100) || null,
  };
}

/** Admin hanya boleh mengurus anggota biasa; akun admin dan root hanya bisa diurus root. */
async function assertCanManage(id: string) {
  const me = await assertRole("admin");
  const { rows } = await pool.query<{ role: Role }>("select role from profiles where id = $1", [
    id,
  ]);
  if (rows[0] && rows[0].role !== "user" && me.role !== "root") {
    throw new UserError("Hanya root yang bisa mengubah akun admin atau root");
  }
  return me;
}

export async function createMember(input: { email: string; full_name: string }) {
  return guard(async () => {
    const m = cleanMember(input);
    try {
      await pool.query("insert into profiles (email, full_name) values ($1, $2)", [
        m.email,
        m.full_name,
      ]);
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserError("Email sudah terdaftar");
      throw error;
    }
  });
}

export async function updateMember(id: string, input: { email: string; full_name: string }) {
  return guard(async () => {
    await assertCanManage(id);
    const m = cleanMember(input);
    try {
      await pool.query("update profiles set email = $2, full_name = $3 where id = $1", [
        id,
        m.email,
        m.full_name,
      ]);
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserError("Email sudah dipakai anggota lain");
      throw error;
    }
  });
}

/** PIC dan penugasan task milik anggota ini menjadi kosong (ON DELETE SET NULL). */
export async function deleteMember(id: string) {
  return guard(async () => {
    const me = await assertCanManage(id);
    if (me.id === id) throw new UserError("Tidak bisa menghapus akun sendiri");
    await pool.query("delete from profiles where id = $1", [id]);
  });
}

/* Master data */

function assertKind(kind: string): asserts kind is MasterKind {
  if (kind !== "status" && kind !== "jenis") throw new UserError("Jenis pilihan tidak valid");
}

export async function addOption(kind: string, value: string) {
  return guard(async () => {
    assertKind(kind);
    const v = String(value ?? "").trim().slice(0, 50);
    if (!v) throw new UserError("Nama pilihan wajib diisi");
    try {
      await pool.query(
        `insert into master_options (kind, value, position)
         values ($1::text, $2::text,
           (select coalesce(max(position), -1) + 1 from master_options where kind = $1::text))`,
        [kind, v],
      );
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserError("Pilihan itu sudah ada");
      throw error;
    }
  });
}

/** Mengganti nama juga memperbarui semua konten yang memakai nama lama. */
export async function renameOption(id: string, value: string) {
  return guard(async () => {
    const next = String(value ?? "").trim().slice(0, 50);
    if (!next) throw new UserError("Nama pilihan wajib diisi");
    try {
      await withTransaction(async (client) => {
        const { rows } = await client.query<{ kind: MasterKind; value: string }>(
          "select kind, value from master_options where id = $1 for update",
          [id],
        );
        const current = rows[0];
        if (!current) throw new UserError("Pilihan tidak ditemukan");
        if (current.value === next) return;

        await client.query("update master_options set value = $2 where id = $1", [id, next]);
        const column = current.kind === "status" ? "status" : "jenis";
        await client.query(`update projects set ${column} = $1 where ${column} = $2`, [
          next,
          current.value,
        ]);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserError("Pilihan dengan nama itu sudah ada");
      throw error;
    }
  });
}

export async function setOptionFinal(id: string, isFinal: boolean) {
  return guard(async () => {
    await pool.query("update master_options set is_final = $2 where id = $1 and kind = 'status'", [
      id,
      Boolean(isFinal),
    ]);
  });
}

export async function moveOption(id: string, direction: string) {
  return guard(async () => {
    await withTransaction(async (client) => {
      const found = await client.query<{ kind: string }>(
        "select kind from master_options where id = $1",
        [id],
      );
      if (!found.rows[0]) throw new UserError("Pilihan tidak ditemukan");
      const list = await client.query<{ id: string }>(
        "select id from master_options where kind = $1 order by position, created_at, id",
        [found.rows[0].kind],
      );
      const next = swapped(
        list.rows.map((r) => r.id),
        id,
        direction,
      );
      if (next) await renumber(client, "master_options", next);
    });
  });
}

export async function deleteOption(id: string) {
  return guard(async () => {
    await withTransaction(async (client) => {
      const { rows } = await client.query<{ kind: MasterKind; value: string }>(
        "select kind, value from master_options where id = $1 for update",
        [id],
      );
      const option = rows[0];
      if (!option) return;

      const column = option.kind === "status" ? "status" : "jenis";
      const used = await client.query<{ n: number }>(
        `select count(*)::int as n from projects where ${column} = $1`,
        [option.value],
      );
      if (used.rows[0].n > 0) {
        throw new UserError(
          `Masih dipakai ${used.rows[0].n} konten. Ganti dulu pilihan di konten tersebut.`,
        );
      }

      if (option.kind === "status") {
        const total = await client.query<{ n: number }>(
          "select count(*)::int as n from master_options where kind = 'status'",
        );
        if (total.rows[0].n <= 1) throw new UserError("Minimal harus ada satu status");
      }

      await client.query("delete from master_options where id = $1", [id]);
    });
  });
}

/* Group */

export async function moveGroup(id: string, direction: string) {
  return guard(async () => {
    await withTransaction(async (client) => {
      const list = await client.query<{ id: string }>(
        "select id from project_groups order by position, created_at, id",
      );
      const next = swapped(
        list.rows.map((r) => r.id),
        id,
        direction,
      );
      if (next) await renumber(client, "project_groups", next);
    });
  });
}

/** groupId kosong = tanpa group. */
export async function moveProjectsToGroup(projectIds: string[], groupId: string) {
  return guard(async () => {
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new UserError("Pilih minimal satu project");
    }
    if (projectIds.length > 1000) throw new UserError("Terlalu banyak project dipilih");
    await pool.query("update projects set group_id = $2::uuid where id = any($1::uuid[])", [
      projectIds,
      groupId || null,
    ]);
  });
}