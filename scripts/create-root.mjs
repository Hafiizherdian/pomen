import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scryptAsync = promisify(scrypt);

const url = process.env.DATABASE_URL;
const username = (process.env.ROOT_USERNAME ?? "").trim().toLowerCase();
const password = process.env.ROOT_PASSWORD ?? "";
const name = (process.env.ROOT_NAME ?? "").trim() || null;
const emailInput = (process.env.ROOT_EMAIL ?? "").trim().toLowerCase();

if (!url) {
  console.error("DATABASE_URL belum di-set di .env.local");
  process.exit(1);
}
if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
  console.error("ROOT_USERNAME harus 3-30 karakter: huruf kecil, angka, titik, garis bawah, strip");
  process.exit(1);
}
if (password.length < 8) {
  console.error("ROOT_PASSWORD minimal 8 karakter");
  process.exit(1);
}
if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
  console.error("ROOT_EMAIL tidak valid");
  process.exit(1);
}

// Kalau sebelumnya sudah membuat root, pakai ROOT_EMAIL yang sama supaya baris itu diperbarui.
const email = emailInput || `${username}@akun.local`;

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);
const hash = `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(
    `insert into profiles (email, username, full_name, role, password_hash, is_active)
     values ($1, $2, $3, 'root', $4, true)
     on conflict (email) do update
     set username = excluded.username,
         role = 'root',
         password_hash = excluded.password_hash,
         is_active = true,
         full_name = coalesce(excluded.full_name, profiles.full_name)`,
    [email, username, name, hash],
  );
  console.log("OK root:", username, `(${email})`);
} finally {
  await client.end();
}