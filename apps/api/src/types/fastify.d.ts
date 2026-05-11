import "@fastify/jwt";
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantContext: { workspaceId: string; userId: string } | null;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      workspaceId: string;
    };
    user: {
      sub: string;
      email: string;
      workspaceId: string;
    };
  }
}
