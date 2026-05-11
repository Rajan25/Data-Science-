import fp from "fastify-plugin";
import { logAccessEvent } from "./service.js";

export const auditPlugin = fp(async (app) => {
  app.addHook("onResponse", async (request, reply) => {
    const routePath = request.routeOptions?.url ?? request.url;
    if (routePath === "/health" || routePath === "/health/db") {
      return;
    }

    const user = request.user as
      | { sub?: string; workspaceId?: string; email?: string }
      | undefined;

    try {
      await logAccessEvent({
        workspaceId: user?.workspaceId,
        actorUserId: user?.sub,
        route: routePath,
        method: request.method,
        statusCode: reply.statusCode,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
        metadata: {
          requestId: request.id
        }
      });
    } catch (error) {
      request.log.warn({ error }, "failed to write access audit log");
    }
  });
});
