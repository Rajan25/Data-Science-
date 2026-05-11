CREATE TABLE IF NOT EXISTS linkedin_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_oauth_states_expires ON linkedin_oauth_states (expires_at);

CREATE TABLE IF NOT EXISTS linkedin_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_member_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT,
  profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_linkedin_connections_workspace ON linkedin_connections (workspace_id);

-- OAuth states are consumed from an unauthenticated callback; do not use RLS here (short-lived random state).
ALTER TABLE linkedin_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_isolation_linkedin_connections ON linkedin_connections;
CREATE POLICY workspace_isolation_linkedin_connections ON linkedin_connections
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);
