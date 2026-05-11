import type { Pool as PgPool } from "pg";
import { Pool } from "pg";

const defaultUrl =
  "postgresql://postgres:postgres@127.0.0.1:5432/linkedin_automation";

let poolInstance: PgPool | undefined;

export function getPool(): PgPool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL ?? defaultUrl
    });
  }
  return poolInstance;
}
