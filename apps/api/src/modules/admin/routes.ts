import { FastifyInstance } from "fastify";
import { z } from "zod";
import { assertAdminAccess, listAccessAuditLogs, migrationStatus } from "./service.js";

const ListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export async function adminRoutes(app: FastifyInstance) {
  app.get("/admin/audit-logs", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const query = ListQuery.parse(request.query);
      const logs = await listAccessAuditLogs(request.user.workspaceId, request.user.sub, query.limit);
      return { logs };
    } catch (error) {
      if (error instanceof Error && error.message === "forbidden") {
        return reply.forbidden("Admin access required");
      }
      throw error;
    }
  });

  app.get(
    "/admin/migrations/status",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        await assertAdminAccess(request.user.workspaceId, request.user.sub);
      } catch (error) {
        if (error instanceof Error && error.message === "forbidden") {
          return reply.forbidden("Admin access required");
        }
        throw error;
      }
      const status = await migrationStatus();
      return { migrations: status };
    }
  );
}
