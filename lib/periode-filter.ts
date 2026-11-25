import "server-only";
import { cookies } from "next/headers";
import { PERIODE_COOKIE, parsePeriodeFilter } from "@/lib/periode";

export async function getPeriodeFilter() {
  const store = await cookies();
  return parsePeriodeFilter(store.get(PERIODE_COOKIE)?.value);
}