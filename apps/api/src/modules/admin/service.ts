import { pool } from "../../db/client.js";
import { queryWithContext } from "../../db/context.js";

export async function assertAdminAccess(workspaceId: string, userId: string) {
  const result = await queryWithContext<{ role: string }>(
    { workspaceId, userId },
    `SELECT role
     FROM workspace_memberships
     WHERE workspace_id = $1 AND user_id = $2
     LIMIT 1`,
    [workspaceId, userId]
  );

  const role = result.rows[0]?.role;
  if (role !== "owner" && role !== "admin") {
    throw new Error("forbidden");
  }
}

export async function listAccessAuditLogs(workspaceId: string, userId: string, limit: number) {
  await assertAdminAccess(workspaceId, userId);
  const result = await queryWithContext<{
    id: string;
    route: string;
    method: string;
    status_code: number;
    ip_address: string | null;
    created_at: string;
  }>(
    { workspaceId, userId },
    `SELECT id, route, method, status_code, ip_address, created_at
     FROM access_audit_logs
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [workspaceId, limit]
  );
  return result.rows;
}

export async function migrationStatus() {
  const result = await pool.query<{ file_name: string; applied_at: string }>(
    `SELECT file_name, applied_at
     FROM schema_migrations
     ORDER BY file_name ASC`
  );
  return {
    count: result.rowCount ?? result.rows.length,
    applied: result.rows
  };
}
