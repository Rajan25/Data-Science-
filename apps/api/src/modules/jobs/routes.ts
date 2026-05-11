import { FastifyInstance } from "fastify";
import { z } from "zod";
import { enqueueJob, listJobs } from "./service.js";

const CreateJobBody = z.object({
  jobType: z.string().min(2).max(100),
  payload: z.record(z.string(), z.unknown()).default({})
});

const ListJobsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export async function jobRoutes(app: FastifyInstance) {
  app.post("/jobs", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = CreateJobBody.parse(request.body);
    const job = await enqueueJob({
      workspaceId: request.user.workspaceId,
      actorUserId: request.user.sub,
      jobType: body.jobType,
      payload: body.payload
    });
    return reply.code(201).send(job);
  });

  app.get("/jobs", { preHandler: [app.authenticate] }, async (request) => {
    const query = ListJobsQuery.parse(request.query);
    const jobs = await listJobs(request.user.workspaceId, request.user.sub, query.limit);
    return { jobs };
  });
}
