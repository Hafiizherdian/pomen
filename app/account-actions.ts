"use server";

import { pool } from "@/lib/db";
import { assertRole } from "@/lib/admin-auth";
import { guardWith, UserError } from "@/lib/admin-guard";
import { hashPassword } from "@/lib/password";
import { isRole, type Role } from "@/lib/roles";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanPassword(value: string) {
  const password = String(value ?? "");
  if (password.length < 8) throw new UserError("Password minimal 8 karakter");
  if (password.length > 200) throw new UserError("Password terlalu panjang");
  return password;
}

function cleanRole(value: string): Role {
  if (!isRole(value)) throw new UserError("Peran tidak valid");
  return value;
}

/** Membuat akun baru, atau memberi akses login ke anggota yang emailnya sudah ada. */
export async function createAccount(input: {
  email: string;
  full_name: string;
  role: string;
  password: string;
}) {
  return guardWith(async () => {
    const me = await assertRole("root");
    const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200);
    if (!EMAIL_RE.test(email)) throw new UserError("Format email tidak valid");
    if (email === me.email.toLowerCase()) {
      throw new UserError("Ubah akun sendiri lewat daftar di bawah");
    }
    const role = cleanRole(input.role);
    const hash = await hashPassword(cleanPassword(input.password));

    await pool.query(
      `insert into profiles (email, full_name, role, password_hash, is_active)
       values ($1, $2, $3, $4, true)
       on conflict (email) do update
       set role = excluded.role,
           password_hash = excluded.password_hash,
           is_active = true,
           full_name = coalesce(excluded.full_name, profiles.full_name)`,
      [email, String(input.full_name ?? "").trim().slice(0, 100) || null, role, hash],
    );
  }, "root");
}

export async function setAccountRole(id: string, role: string) {
  return guardWith(async () => {
    const me = await assertRole("root");
    if (me.id === id) throw new UserError("Tidak bisa mengubah peran akun sendiri");
    await pool.query("update profiles set role = $2 where id = $1", [id, cleanRole(role)]);
  }, "root");
}

export async function setAccountActive(id: string, active: boolean) {
  return guardWith(async () => {
    const me = await assertRole("root");
    if (me.id === id) throw new UserError("Tidak bisa menonaktifkan akun sendiri");
    await pool.query("update profiles set is_active = $2 where id = $1", [id, Boolean(active)]);
  }, "root");
}

export async function resetAccountPassword(id: string, password: string) {
  return guardWith(async () => {
    const hash = await hashPassword(cleanPassword(password));
    await pool.query("update profiles set password_hash = $2 where id = $1", [id, hash]);
  }, "root");
}