// Tanpa karakter yang mirip (0/O, 1/l/I) supaya mudah disalin manual.
const SETS = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%&*?"];

/** Angka acak 0..max-1 tanpa bias modulo. */
function randomInt(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

const pick = (chars: string) => chars[randomInt(chars.length)];

/** Password acak, minimal satu karakter dari tiap kelompok. */
export function generatePassword(length = 14) {
  const all = SETS.join("");
  const chars = SETS.map(pick);
  while (chars.length < length) chars.push(pick(all));
  // Acak urutan (Fisher-Yates).
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}