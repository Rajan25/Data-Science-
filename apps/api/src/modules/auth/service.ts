import bcrypt from "bcryptjs";
import { pool } from "../../db/client.js";

export async function createUserWithWorkspace(params: {
  email: string;
  password: string;
  displayName?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const passwordHash = await bcrypt.hash(params.password, 12);

    const userResult = await client.query<{ id: string; email: string }>(
      `INSERT INTO users (email, display_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email`,
      [params.email.toLowerCase(), params.displayName ?? null, passwordHash]
    );

    const workspaceResult = await client.query<{ id: string }>(
      `INSERT INTO workspaces (name)
       VALUES ($1)
       RETURNING id`,
      [params.displayName ? `${params.displayName}'s Workspace` : "Default Workspace"]
    );

    await client.query(
      `INSERT INTO workspace_memberships (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [workspaceResult.rows[0].id, userResult.rows[0].id]
    );

    await client.query("COMMIT");

    return {
      userId: userResult.rows[0].id,
      email: userResult.rows[0].email,
      workspaceId: workspaceResult.rows[0].id
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function loginByEmailPassword(params: { email: string; password: string }) {
  const result = await pool.query<{
    id: string;
    email: string;
    password_hash: string;
    workspace_id: string;
  }>(
    `SELECT u.id, u.email, u.password_hash, wm.workspace_id
     FROM users u
     JOIN workspace_memberships wm ON wm.user_id = u.id
     WHERE u.email = $1
     ORDER BY wm.created_at ASC
     LIMIT 1`,
    [params.email.toLowerCase()]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const ok = await bcrypt.compare(params.password, row.password_hash);
  if (!ok) {
    return null;
  }

  return {
    userId: row.id,
    email: row.email,
    workspaceId: row.workspace_id
  };
}
