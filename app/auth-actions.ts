"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/admin-token";
import { verifyPassword } from "@/lib/password";
import { isRole } from "@/lib/roles";
import { normalizeUsername } from "@/lib/username";
import type { LoginState } from "@/lib/admin-types";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!process.env.SESSION_SECRET) {
    return { error: "SESSION_SECRET belum diatur di environment server." };
  }

  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const { rows } = await pool.query<{
    id: string;
    role: string;
    password_hash: string | null;
    is_active: boolean;
  }>("select id, role, password_hash, is_active from profiles where username = $1", [username]);
  const user = rows[0];

  const valid = Boolean(
    user &&
      isRole(user.role) &&
      user.is_active &&
      user.password_hash &&
      (await verifyPassword(password, user.password_hash)),
  );
  if (!user || !isRole(user.role) || !valid) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: "Username atau password salah." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken({ userId: user.id, role: user.role }), {
    httpOnly: true,
    sameSite: "lax",
    // Set ADMIN_COOKIE_SECURE=false jika aplikasi diakses lewat HTTP (tanpa HTTPS).
    secure: process.env.NODE_ENV === "production" && process.env.ADMIN_COOKIE_SECURE !== "false",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  // Hanya terima alamat internal supaya tidak jadi open redirect.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}