import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      file_name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function appliedFileSet(): Promise<Set<string>> {
  const result = await pool.query<{ file_name: string }>(
    "SELECT file_name FROM schema_migrations ORDER BY file_name ASC"
  );
  return new Set(result.rows.map((r) => r.file_name));
}

async function run() {
  await ensureMigrationsTable();
  const applied = await appliedFileSet();
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (file_name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied migration: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("migrations complete");
}

run()
  .catch((error) => {
    console.error("migration failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
