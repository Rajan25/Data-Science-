import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createUserWithWorkspace, loginByEmailPassword } from "./service.js";

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(120).optional()
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = RegisterBody.parse(request.body);
    const user = await createUserWithWorkspace(parsed);

    const token = await reply.jwtSign({
      sub: user.userId,
      email: user.email,
      workspaceId: user.workspaceId
    });

    return { token, user };
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = LoginBody.parse(request.body);
    const user = await loginByEmailPassword(parsed);
    if (!user) {
      return reply.unauthorized("Invalid credentials");
    }

    const token = await reply.jwtSign({
      sub: user.userId,
      email: user.email,
      workspaceId: user.workspaceId
    });

    return { token, user };
  });

  // Must live here (not in main.ts): `app.authenticate` is only defined after authPlugin runs at bootstrap.
  app.get("/me", { preHandler: [app.authenticate] }, async (request) => {
    return { user: request.user };
  });
}
