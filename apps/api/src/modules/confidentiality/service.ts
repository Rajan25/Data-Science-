import { z } from "zod";
import { queryWithContext } from "../../db/context.js";

export const ConfidentialityEventPayload = z.record(z.string(), z.unknown()).default({});

export async function createConfidentialityEvent(params: {
  workspaceId: string;
  actorUserId: string;
  eventType: string;
  eventPayload: Record<string, unknown>;
}) {
  const result = await queryWithContext<{
    id: string;
    event_type: string;
    event_payload: Record<string, unknown>;
    created_at: string;
  }>(
    { workspaceId: params.workspaceId, userId: params.actorUserId },
    `INSERT INTO confidentiality_events (workspace_id, actor_user_id, event_type, event_payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, event_type, event_payload, created_at`,
    [params.workspaceId, params.actorUserId, params.eventType, JSON.stringify(params.eventPayload)]
  );
  return result.rows[0];
}

export async function listConfidentialityEvents(workspaceId: string, userId: string, limit: number) {
  const result = await queryWithContext<{
    id: string;
    event_type: string;
    event_payload: Record<string, unknown>;
    created_at: string;
  }>(
    { workspaceId, userId },
    `SELECT id, event_type, event_payload, created_at
     FROM confidentiality_events
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [workspaceId, limit]
  );
  return result.rows;
}
