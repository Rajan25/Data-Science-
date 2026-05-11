import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";

export const authPlugin = fp(async (app) => {
  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (error) {
        reply.send(error);
      }
    }
  );
});
