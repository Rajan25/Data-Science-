import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { getPool } from "./db.js";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const redisOpts = { maxRetriesPerRequest: null };
// Queue and Worker must not share one connection (Worker uses blocking Redis commands).
const queueConnection = new Redis(redisUrl, redisOpts);
const workerConnection = new Redis(redisUrl, redisOpts);
const queue = new Queue("content-jobs", { connection: queueConnection });

const worker = new Worker(
  "content-jobs",
  async (job) => {
    const jobId = (job.data as { jobId?: string }).jobId;
    if (!jobId) {
      return;
    }

    const client = await getPool().connect();
    try {
      await client.query(
        `UPDATE job_records
         SET status = 'processing', updated_at = NOW()
         WHERE id = $1`,
        [jobId]
      );

      const result = await client.query<{
        id: string;
        job_type: string;
        payload: Record<string, unknown>;
      }>(
        `SELECT id, job_type, payload
         FROM job_records
         WHERE id = $1
         LIMIT 1`,
        [jobId]
      );

      const record = result.rows[0];
      if (!record) {
        return;
      }

      // Placeholder for task-specific processing by job_type.
      await client.query(
        `UPDATE job_records
         SET status = 'completed', updated_at = NOW()
         WHERE id = $1`,
        [record.id]
      );
    } catch (error) {
      await client.query(
        `UPDATE job_records
         SET status = 'failed', error_message = $2, updated_at = NOW()
         WHERE id = $1`,
        [jobId, error instanceof Error ? error.message : "unknown error"]
      );
      throw error;
    } finally {
      client.release();
    }
  },
  { connection: workerConnection }
);

async function bootstrap() {
  await queue.add("worker-startup-check", { at: new Date().toISOString() });
  // Keep startup minimal until job contracts are finalized.
  console.log("worker ready");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

worker.on("failed", (job, err) => {
  console.error("job failed", { id: job?.id, name: job?.name, err: err.message });
});
