import { Redis } from "ioredis";
import { Queue } from "bullmq";
import { queryWithContext } from "../../db/context.js";

const redisConnection = new Redis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
const contentQueue = new Queue("content-jobs", { connection: redisConnection });

export async function enqueueJob(params: {
  workspaceId: string;
  actorUserId: string;
  jobType: string;
  payload: Record<string, unknown>;
}) {
  const insert = await queryWithContext<{ id: string }>(
    { workspaceId: params.workspaceId, userId: params.actorUserId },
    `INSERT INTO job_records (workspace_id, actor_user_id, job_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id`,
    [params.workspaceId, params.actorUserId, params.jobType, JSON.stringify(params.payload)]
  );

  const jobId = insert.rows[0].id;
  await contentQueue.add(params.jobType, { jobId });
  return { jobId };
}

export async function listJobs(workspaceId: string, userId: string, limit: number) {
  const result = await queryWithContext<{
    id: string;
    job_type: string;
    status: string;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  }>(
    { workspaceId, userId },
    `SELECT id, job_type, status, error_message, created_at, updated_at
     FROM job_records
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
