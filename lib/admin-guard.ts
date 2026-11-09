import "server-only";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";

/** Error yang pesannya aman ditampilkan ke admin. */
export class UserError extends Error {}

/** Seperti guard di admin-actions, tapi mengembalikan data hasil. */
export async function guardWith<T>(
  fn: () => Promise<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
  }
}