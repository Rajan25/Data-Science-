import type { QueryResultRow } from "pg";
import { pool } from "./client.js";

type DbContext = {
  workspaceId?: string;
  userId?: string;
};

async function applyContext(client: { query: (sql: string, params?: unknown[]) => Promise<unknown> }, ctx: DbContext) {
  await client.query("SELECT set_config('app.current_workspace_id', $1, true)", [
    ctx.workspaceId ?? ""
  ]);
  await client.query("SELECT set_config('app.current_user_id', $1, true)", [ctx.userId ?? ""]);
}

export async function withDbContext<T>(
  ctx: DbContext,
  handler: (client: { query: <R extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]) => Promise<{ rows: R[] }> }) => Promise<T>
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await applyContext(client, ctx);
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function queryWithContext<R extends QueryResultRow = QueryResultRow>(
  ctx: DbContext,
  sql: string,
  params: unknown[] = []
) {
  return withDbContext(ctx, async (client) => client.query<R>(sql, params));
}
