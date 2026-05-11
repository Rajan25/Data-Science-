import { FastifyInstance } from "fastify";
import { queryWithContext } from "../../../db/context.js";
import {
  buildAuthorizationUrl,
  consumeOAuthState,
  createOAuthState,
  exchangeAuthorizationCode,
  fetchLinkedInUserinfo,
  getLinkedInConfig,
  upsertLinkedInConnection
} from "./service.js";

export async function linkedinIntegrationRoutes(app: FastifyInstance) {
  app.get(
    "/integrations/linkedin/start",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const cfg = getLinkedInConfig();
      if (!cfg.clientId) {
        return reply.code(503).send({
          error: "linkedin_not_configured",
          message: "Set LINKEDIN_CLIENT_ID and related env vars (see docs/integrations/LINKEDIN_SETUP.md)."
        });
      }

      const { stateToken } = await createOAuthState({
        workspaceId: request.user.workspaceId,
        userId: request.user.sub
      });

      const authorizationUrl = buildAuthorizationUrl({ state: stateToken });
      return { authorizationUrl, state: stateToken };
    }
  );

  app.get("/integrations/linkedin/callback", async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    if (q.error) {
      return reply.code(400).send({
        error: "linkedin_oauth_denied",
        message: q.error_description ?? q.error
      });
    }

    const code = q.code;
    const state = q.state;
    if (!code || !state) {
      return reply.code(400).send({ error: "missing_code_or_state" });
    }

    const row = await consumeOAuthState(state);
    if (!row) {
      return reply.code(400).send({ error: "invalid_or_expired_state" });
    }

    try {
      const tokens = await exchangeAuthorizationCode(code);
      const profile = await fetchLinkedInUserinfo(tokens.access_token);
      const memberId = String(profile.sub ?? profile.id ?? "");
      if (!memberId) {
        return reply.code(502).send({ error: "linkedin_profile_missing_sub" });
      }

      await upsertLinkedInConnection({
        workspaceId: row.workspace_id,
        userId: row.user_id,
        memberId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresInSeconds: tokens.expires_in ?? null,
        scopes: tokens.scope ?? null,
        profileJson: profile
      });

      const redirect = process.env.LINKEDIN_OAUTH_SUCCESS_URL;
      if (redirect) {
        return reply.redirect(redirect, 302);
      }

      return { ok: true, linkedinMemberId: memberId };
    } catch (err) {
      request.log.error(err);
      return reply.code(502).send({
        error: "linkedin_oauth_failed",
        message: err instanceof Error ? err.message : "unknown error"
      });
    }
  });

  app.get(
    "/integrations/linkedin/connection",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const result = await queryWithContext<{
        linkedin_member_id: string;
        scopes: string | null;
        token_expires_at: string | null;
        updated_at: string;
      }>(
        { workspaceId: request.user.workspaceId, userId: request.user.sub },
        `SELECT linkedin_member_id, scopes, token_expires_at, updated_at
         FROM linkedin_connections
         WHERE workspace_id = $1 AND user_id = $2
         LIMIT 1`,
        [request.user.workspaceId, request.user.sub]
      );
      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ connected: false });
      }
      return {
        connected: true,
        linkedinMemberId: row.linkedin_member_id,
        scopes: row.scopes,
        tokenExpiresAt: row.token_expires_at,
        updatedAt: row.updated_at
      };
    }
  );
}
