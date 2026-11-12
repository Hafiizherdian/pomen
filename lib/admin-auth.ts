import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { SESSION_COOKIE, readSessionToken } from "@/lib/admin-token";
import { roleAtLeast, type Role } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: Role;
};

/** User yang sedang login, dibaca dari database (peran dan status aktif selalu terbaru). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const { rows } = await pool.query<CurrentUser>(
    `select id, email, username, full_name, role
     from profiles
     where id = $1
       and is_active
       and password_hash is not null
       and username is not null`,
    [session.userId],
  );
  return rows[0] ?? null;
});

/** Untuk halaman: belum login -> /login, peran kurang -> kembali ke halaman yang boleh. */
export async function requireRole(min: Role = "user") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roleAtLeast(user.role, min)) redirect(min === "root" ? "/admin" : "/");
  return user;
}

/** Untuk server action (action bisa dipanggil langsung lewat POST). */
export async function assertRole(min: Role) {
  const user = await getCurrentUser();
  if (!user || !roleAtLeast(user.role, min)) throw new Error("Tidak diizinkan");
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return Boolean(user && roleAtLeast(user.role, "admin"));
}
export const requireAdmin = () => requireRole("admin");
export const assertAdmin = () => assertRole("admin");