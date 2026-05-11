import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool as PgPool } from "pg";
import { Pool } from "pg";

const defaultUrl =
  "postgresql://postgres:postgres@127.0.0.1:5432/linkedin_automation";

let poolInstance: PgPool | undefined;

/**
 * Pool is created lazily so `process.env.DATABASE_URL` is read after the process
 * environment is fully set (Windows cmd / npm startup ordering).
 */
export function getPool(): PgPool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL ?? defaultUrl;
    poolInstance = new Pool({ connectionString });
  }
  return poolInstance;
}

export const pool = new Proxy({} as PgPool, {
  get(_target, prop, receiver) {
    const p = getPool();
    const value = Reflect.get(p, prop, receiver) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(p);
    }
    return value;
  }
});

export const db = drizzle(pool);
