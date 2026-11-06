/**
 * Token sesi admin: "<kedaluwarsa>.<tanda tangan HMAC>".
 * Menggunakan Web Crypto API agar kompatibel dengan Edge Runtime (middleware).
 */

export const ADMIN_COOKIE = "admin_pomen";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam, dalam detik

const encoder = new TextEncoder();

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

// Helper: Konversi ArrayBuffer ke Hex String
function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: Konversi Hex String ke Uint8Array (untuk perbandingan konstan)
function hexToBuffer(hex: string) {
  if (hex.length % 2 !== 0) return new Uint8Array(0);
  const buffer = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buffer[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return buffer;
}

// Helper: Pengganti timingSafeEqual
function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  let result = 0;
  for (let i = 0; i < a.byteLength; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function sign(payload: string) {
  const s = secret();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(s),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return bufferToHex(signature);
}

// SEKARANG MENJADI ASYNC
export async function createSessionToken() {
  const payload = String(Date.now() + SESSION_MAX_AGE * 1000);
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

// SEKARANG MENJADI ASYNC
export async function verifySessionToken(token: string | undefined | null) {
  // Tanpa password/secret, admin dianggap nonaktif (fail closed).
  if (!token || !secret()) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedHex = await sign(payload);
  
  const expected = hexToBuffer(expectedHex);
  const actual = hexToBuffer(signature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return false;
  }

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

// SEKARANG MENJADI ASYNC
export async function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode("pw"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const aBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(input));
  const bBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(expected));

  return timingSafeEqual(new Uint8Array(aBuffer), new Uint8Array(bBuffer));
}