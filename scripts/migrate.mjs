import { readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set di .env.local");
  process.exit(1);
}

const files = ["db/schema.sql"];
if (process.argv.includes("--seed")) files.push("db/seed.sql");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  for (const file of files) {
    await client.query(await readFile(file, "utf8"));
    console.log("OK", file);
  }
} finally {
  await client.end();
}