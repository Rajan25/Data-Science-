import { queryWithContext } from "../../db/context.js";

export async function getWorkspaceById(workspaceId: string, userId: string) {
  const result = await queryWithContext<{ id: string; name: string; created_at: string }>(
    { workspaceId, userId },
    `SELECT id, name, created_at
     FROM workspaces
     WHERE id = $1`,
    [workspaceId]
  );
  return result.rows[0] ?? null;
}

export async function listWorkspaceMembers(workspaceId: string, userId: string) {
  const result = await queryWithContext<{
    user_id: string;
    email: string;
    display_name: string | null;
    role: string;
  }>(
    { workspaceId, userId },
    `SELECT wm.user_id, u.email, u.display_name, wm.role
     FROM workspace_memberships wm
     JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1
     ORDER BY wm.created_at ASC`,
    [workspaceId]
  );
  return result.rows;
}
