/** Bulan project disimpan sebagai "YYYY-MM". */
export const PERIODE_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isPeriode(value: unknown): value is string {
  return typeof value === "string" && PERIODE_RE.test(value);
}

/** Bulan berjalan menurut waktu Jakarta. Panggil setelah ada akses data dinamis di Server Component. */
export function currentPeriode() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 7);
}

export function formatPeriode(periode: string) {
  return new Date(`${periode}-01T00:00:00`).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}