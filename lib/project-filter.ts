/** Filter header selain periode. "" = semua. Aman dipakai di server maupun client. */
export const PIC_COOKIE = "pomen_pic";
export const JENIS_COOKIE = "pomen_jenis";

/** Nilai khusus: konten yang belum punya PIC / jenis. */
export const FILTER_NONE = "none";

export type ProjectFilter = {
  periode: string;
  /** id profile, FILTER_NONE, atau "". */
  pic: string;
  /** nilai jenis konten, FILTER_NONE, atau "". */
  jenis: string;
};

export const EMPTY_FILTER: ProjectFilter = { periode: "", pic: "", jenis: "" };

export function cleanFilterValue(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}