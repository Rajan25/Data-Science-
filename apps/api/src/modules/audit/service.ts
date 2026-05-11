import { pool } from "../../db/client.js";

export async function logAccessEvent(params: {
  workspaceId?: string;
  actorUserId?: string;
  route: string;
  method: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  await pool.query(
    `INSERT INTO access_audit_logs
      (workspace_id, actor_user_id, route, method, status_code, ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [
      params.workspaceId ?? null,
      params.actorUserId ?? null,
      params.route,
      params.method,
      params.statusCode,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      JSON.stringify(params.metadata ?? {})
    ]
  );
}
