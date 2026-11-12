export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

/** Username selalu disimpan dan dicari dalam huruf kecil. */
export function normalizeUsername(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}