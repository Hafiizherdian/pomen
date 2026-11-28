import "server-only";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

export type LoginHistoryRow = {
  id: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

/** Dipanggil dari action login. Gagal mencatat tidak boleh menggagalkan login. */
export async function recordLogin(userId: string | null, username: string, success: boolean) {
  try {
    const h = await headers();
    // Header ini hanya bisa dipercaya jika diisi oleh reverse proxy anda.
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip");
    await pool.query(
      `insert into login_history (user_id, username, success, ip_address, user_agent)
       values ($1, $2, $3, $4, $5)`,
      [userId, username.slice(0, 100), success, ip, h.get("user-agent")?.slice(0, 300) ?? null],
    );
  } catch (error) {
    console.error("Gagal mencatat riwayat login", error);
  }
}

export async function getAccountLoginHistory(userId: string, limit = 50) {
  const { rows } = await pool.query<LoginHistoryRow>(
    `select id, success, ip_address, user_agent, created_at
     from login_history
     where user_id = $1
     order by created_at desc
     limit $2`,
    [userId, limit],
  );
  return rows;
}