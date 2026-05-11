import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ConfidentialityEventPayload,
  createConfidentialityEvent,
  listConfidentialityEvents
} from "./service.js";

const CreateEventBody = z.object({
  eventType: z.string().min(2).max(120),
  eventPayload: ConfidentialityEventPayload
});

const EventQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export async function confidentialityRoutes(app: FastifyInstance) {
  app.post(
    "/confidentiality/events",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const body = CreateEventBody.parse(request.body);
      const event = await createConfidentialityEvent({
        workspaceId: request.user.workspaceId,
        actorUserId: request.user.sub,
        eventType: body.eventType,
        eventPayload: body.eventPayload
      });

      return reply.code(201).send({ event });
    }
  );

  app.get(
    "/confidentiality/events",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = EventQuery.parse(request.query);
      const events = await listConfidentialityEvents(
        request.user.workspaceId,
        request.user.sub,
        query.limit
      );
      return { events };
    }
  );
}
