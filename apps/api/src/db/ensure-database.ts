import { Client } from "pg";

const defaultUrl =
  "postgresql://postgres:postgres@127.0.0.1:5432/linkedin_automation";

function adminUrlForSameServer(targetUrl: string, adminDatabase = "postgres"): string {
  const u = new URL(targetUrl);
  u.pathname = `/${adminDatabase}`;
  return u.toString();
}

function databaseNameFromUrl(targetUrl: string): string {
  const u = new URL(targetUrl);
  const name = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (!name || name === "postgres") {
    throw new Error("DATABASE_URL must include a non-postgres database name to create");
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Unsafe database name "${name}" — use only letters, digits, underscore, hyphen`);
  }
  return name;
}

async function run() {
  const targetUrl = process.env.DATABASE_URL ?? defaultUrl;
  const dbName = databaseNameFromUrl(targetUrl);
  const adminUrl = adminUrlForSameServer(targetUrl);

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();

  try {
    const exists = await admin.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [dbName]
    );
    if (exists.rows[0]?.exists) {
      console.log(`database "${dbName}" already exists`);
      try {
        const probe = new Client({ connectionString: targetUrl });
        await probe.connect();
        await probe.query("SELECT 1");
        await probe.end();
        console.log(`verified connection to "${dbName}"`);
      } catch (err) {
        console.error(
          `pg_database lists "${dbName}" but connecting with DATABASE_URL failed. Check host/port (another Postgres on 5432?) and credentials.`,
          err
        );
        throw err;
      }
      return;
    }

    const quotedIdent = `"${dbName.replace(/"/g, '""')}"`;
    await admin.query(`CREATE DATABASE ${quotedIdent}`);
    console.log(`created database "${dbName}"`);
  } finally {
    await admin.end();
  }
}

run().catch((err) => {
  console.error("ensure-database failed", err);
  process.exit(1);
});
