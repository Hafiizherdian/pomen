/**
 * Token sesi: "<userId>:<role>:<kedaluwarsa>.<tanda tangan HMAC>".
 * Memakai Web Crypto agar kompatibel dengan Edge Runtime (middleware).
 */
import { isRole, type Role } from "@/lib/roles";

export const SESSION_COOKIE = "pomen_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam, dalam detik

const encoder = new TextEncoder();

function secret() {
  return process.env.SESSION_SECRET ?? "";
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string) {
  if (hex.length % 2 !== 0) return new Uint8Array(0);
  const buffer = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buffer[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return buffer;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  let result = 0;
  for (let i = 0; i < a.byteLength; i++) result |= a[i] ^ b[i];
  return result === 0;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bufferToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

export type SessionPayload = { userId: string; role: Role };

export async function createSessionToken({ userId, role }: SessionPayload) {
  const payload = `${userId}:${role}:${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${await sign(payload)}`;
}

/** Mengembalikan isi token jika tanda tangan valid dan belum kedaluwarsa, selain itu null. */
export async function readSessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  // Tanpa SESSION_SECRET, semua login dianggap tidak valid (fail closed).
  if (!token || !secret()) return null;

  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = hexToBuffer(await sign(payload));
  const actual = hexToBuffer(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  const [userId, role, expiresAt] = payload.split(":");
  if (!userId || !isRole(role) || !(Number(expiresAt) > Date.now())) return null;
  return { userId, role };
}