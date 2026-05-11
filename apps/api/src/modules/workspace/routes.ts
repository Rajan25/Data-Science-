import { FastifyInstance } from "fastify";
import { getWorkspaceById, listWorkspaceMembers } from "./service.js";

export async function workspaceRoutes(app: FastifyInstance) {
  app.get("/workspace/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const workspaceId = request.user.workspaceId;
    const workspace = await getWorkspaceById(workspaceId, request.user.sub);
    if (!workspace) {
      return reply.notFound("Workspace not found");
    }
    return { workspace };
  });

  app.get("/workspace/me/members", { preHandler: [app.authenticate] }, async (request) => {
    const members = await listWorkspaceMembers(request.user.workspaceId, request.user.sub);
    return { members };
  });
}
