import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";

export const workspaceContextPlugin = fp(async (app) => {
  app.decorateRequest("tenantContext", null);

  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    // Only enforce tenant context for authenticated routes.
    const user = request.user as { workspaceId?: string; sub?: string } | undefined;
    if (!user?.workspaceId) {
      return;
    }

    const headerWorkspaceId = request.headers["x-workspace-id"];
    if (typeof headerWorkspaceId === "string" && headerWorkspaceId !== user.workspaceId) {
      return reply.forbidden("Workspace header does not match authenticated workspace");
    }

    request.tenantContext = {
      workspaceId: user.workspaceId,
      userId: user.sub ?? ""
    };
  });
});
