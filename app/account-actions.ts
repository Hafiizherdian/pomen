"use server";

import { pool } from "@/lib/db";
import { assertRole } from "@/lib/admin-auth";
import { guardWith, UserError } from "@/lib/admin-guard";
import { hashPassword } from "@/lib/password";
import { isRole, type Role } from "@/lib/roles";
import { USERNAME_RE, normalizeUsername } from "@/lib/username";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}

function cleanUsername(value: unknown) {
  const username = normalizeUsername(value);
  if (!USERNAME_RE.test(username)) {
    throw new UserError(
      "Username 3-30 karakter: huruf kecil, angka, titik, garis bawah, atau strip",
    );
  }
  return username;
}

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

/**
 * Membuat akun baru. Jika email diisi dan sudah ada di Anggota Tim, anggota itu
 * diberi akses login. Jika email kosong, dipakai email sementara username@akun.local.
 */
export async function createAccount(input: {
  username: string;
  full_name: string;
  email: string;
  role: string;
  password: string;
}) {
  return guardWith(async () => {
    const me = await assertRole("root");
    const username = cleanUsername(input.username);
    const role = cleanRole(input.role);
    const hash = await hashPassword(cleanPassword(input.password));
    const fullName = String(input.full_name ?? "").trim().slice(0, 100) || null;
    const emailInput = String(input.email ?? "").trim().toLowerCase().slice(0, 200);

    if (emailInput && !EMAIL_RE.test(emailInput)) throw new UserError("Format email tidak valid");
    if (username === me.username || (emailInput && emailInput === me.email.toLowerCase())) {
      throw new UserError("Ubah akun sendiri lewat daftar di bawah");
    }

    try {
      if (emailInput) {
        await pool.query(
          `insert into profiles (email, username, full_name, role, password_hash, is_active)
           values ($1, $2, $3, $4, $5, true)
           on conflict (email) do update
           set username = excluded.username,
               role = excluded.role,
               password_hash = excluded.password_hash,
               is_active = true,
               full_name = coalesce(excluded.full_name, profiles.full_name)`,
          [emailInput, username, fullName, role, hash],
        );
      } else {
        await pool.query(
          `insert into profiles (email, username, full_name, role, password_hash, is_active)
           values ($1, $2, $3, $4, $5, true)`,
          [`${username}@akun.local`, username, fullName, role, hash],
        );
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UserError("Username atau email sudah dipakai akun lain");
      }
      throw error;
    }
  }, "root");
}

export async function setAccountUsername(id: string, username: string) {
  return guardWith(async () => {
    await assertRole("root");
    const value = cleanUsername(username);
    try {
      await pool.query("update profiles set username = $2 where id = $1", [id, value]);
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserError("Username sudah dipakai akun lain");
      throw error;
    }
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
    await assertRole("root");
    const hash = await hashPassword(cleanPassword(password));
    await pool.query("update profiles set password_hash = $2 where id = $1", [id, hash]);
  }, "root");
}