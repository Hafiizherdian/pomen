import "server-only";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/admin-auth";
import type { Role } from "@/lib/roles";

/** Error yang pesannya aman ditampilkan ke admin. */
export class UserError extends Error {}

/** Seperti guard di admin-actions, tapi mengembalikan data hasil. `min` = peran minimal. */
export async function guardWith<T>(
  fn: () => Promise<T>,
  min: Role = "admin",
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    await assertRole(min);
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
  }
}