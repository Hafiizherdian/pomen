import "server-only";
import { cookies } from "next/headers";
import { PERIODE_COOKIE, parsePeriodeFilter } from "@/lib/periode";
import { JENIS_COOKIE, PIC_COOKIE, cleanFilterValue, type ProjectFilter } from "@/lib/project-filter";

export async function getPeriodeFilter() {
  const store = await cookies();
  return parsePeriodeFilter(store.get(PERIODE_COOKIE)?.value);
}

/** Semua filter header: periode, PIC, dan jenis konten. */
export async function getProjectFilter(): Promise<ProjectFilter> {
  const store = await cookies();
  return {
    periode: parsePeriodeFilter(store.get(PERIODE_COOKIE)?.value),
    pic: cleanFilterValue(store.get(PIC_COOKIE)?.value),
    jenis: cleanFilterValue(store.get(JENIS_COOKIE)?.value),
  };
}