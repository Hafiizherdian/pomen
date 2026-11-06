import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-token";

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Dipanggil di awal tiap halaman admin: belum masuk -> ke halaman login. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Dipanggil di tiap server action admin (action bisa dipanggil langsung lewat POST). */
export async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Tidak diizinkan");
}