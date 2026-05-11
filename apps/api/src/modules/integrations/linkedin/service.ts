import crypto from "node:crypto";
import { queryWithContext } from "../../../db/context.js";
import { pool } from "../../../db/client.js";

const AUTH_BASE = "https://www.linkedin.com/oauth/v2";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

export function getLinkedInConfig() {
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    redirectUri: process.env.LINKEDIN_REDIRECT_URI ?? "http://127.0.0.1:3001/integrations/linkedin/callback",
    scopes: process.env.LINKEDIN_SCOPES ?? "openid profile email"
  };
}

export async function createOAuthState(params: {
  workspaceId: string;
  userId: string;
  ttlMinutes?: number;
}) {
  const stateToken = crypto.randomBytes(24).toString("hex");
  const ttl = params.ttlMinutes ?? 10;
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

  await queryWithContext(
    { workspaceId: params.workspaceId, userId: params.userId },
    `INSERT INTO linkedin_oauth_states (workspace_id, user_id, state_token, expires_at)
     VALUES ($1, $2, $3, $4::timestamptz)`,
    [params.workspaceId, params.userId, stateToken, expiresAt]
  );

  return { stateToken, expiresAt };
}

export async function consumeOAuthState(stateToken: string) {
  const result = await pool.query<{
    id: string;
    workspace_id: string;
    user_id: string;
    expires_at: string;
  }>(
    `DELETE FROM linkedin_oauth_states
     WHERE state_token = $1
     RETURNING id, workspace_id, user_id, expires_at`,
    [stateToken]
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  if (new Date(row.expires_at) < new Date()) {
    return null;
  }
  return row;
}

export function buildAuthorizationUrl(params: { state: string }) {
  const { clientId, redirectUri, scopes } = getLinkedInConfig();
  if (!clientId) {
    throw new Error("LINKEDIN_CLIENT_ID is not configured");
  }
  const u = new URL(`${AUTH_BASE}/authorization`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", params.state);
  u.searchParams.set("scope", scopes);
  return u.toString();
}

export async function exchangeAuthorizationCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getLinkedInConfig();
  requireEnv("LINKEDIN_CLIENT_ID");
  requireEnv("LINKEDIN_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
  };

  return json;
}

export async function fetchLinkedInUserinfo(accessToken: string) {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn userinfo failed: ${res.status} ${text}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function upsertLinkedInConnection(params: {
  workspaceId: string;
  userId: string;
  memberId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number | null;
  scopes: string | null;
  profileJson: Record<string, unknown>;
}) {
  const tokenExpiresAt =
    params.expiresInSeconds != null
      ? new Date(Date.now() + params.expiresInSeconds * 1000).toISOString()
      : null;

  await queryWithContext(
    { workspaceId: params.workspaceId, userId: params.userId },
    `INSERT INTO linkedin_connections
      (workspace_id, user_id, linkedin_member_id, access_token, refresh_token, token_expires_at, scopes, profile_json)
     VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8::jsonb)
     ON CONFLICT (workspace_id, user_id) DO UPDATE SET
       linkedin_member_id = EXCLUDED.linkedin_member_id,
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       token_expires_at = EXCLUDED.token_expires_at,
       scopes = EXCLUDED.scopes,
       profile_json = EXCLUDED.profile_json,
       updated_at = NOW()`,
    [
      params.workspaceId,
      params.userId,
      params.memberId,
      params.accessToken,
      params.refreshToken,
      tokenExpiresAt,
      params.scopes,
      JSON.stringify(params.profileJson)
    ]
  );
}
