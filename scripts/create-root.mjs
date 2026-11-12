import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scryptAsync = promisify(scrypt);

const url = process.env.DATABASE_URL;
const email = (process.env.ROOT_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ROOT_PASSWORD ?? "";
const name = (process.env.ROOT_NAME ?? "").trim() || null;

if (!url) {
  console.error("DATABASE_URL belum di-set di .env.local");
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("ROOT_EMAIL tidak valid");
  process.exit(1);
}
if (password.length < 8) {
  console.error("ROOT_PASSWORD minimal 8 karakter");
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);
const hash = `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(
    `insert into profiles (email, full_name, role, password_hash, is_active)
     values ($1, $2, 'root', $3, true)
     on conflict (email) do update
     set role = 'root', password_hash = excluded.password_hash, is_active = true,
         full_name = coalesce(excluded.full_name, profiles.full_name)`,
    [email, name, hash],
  );
  console.log("OK root:", email);
} finally {
  await client.end();
}