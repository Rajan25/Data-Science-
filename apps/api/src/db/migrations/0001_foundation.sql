CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS confidentiality_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidentiality_events ENABLE ROW LEVEL SECURITY;

-- App layer must set app.current_workspace_id for each request.
DROP POLICY IF EXISTS workspace_isolation_workspaces ON workspaces;
CREATE POLICY workspace_isolation_workspaces ON workspaces
  USING (id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);

DROP POLICY IF EXISTS workspace_isolation_memberships ON workspace_memberships;
CREATE POLICY workspace_isolation_memberships ON workspace_memberships
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);

DROP POLICY IF EXISTS workspace_isolation_confidentiality_events ON confidentiality_events;
CREATE POLICY workspace_isolation_confidentiality_events ON confidentiality_events
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);

DROP POLICY IF EXISTS user_self_policy ON users;
CREATE POLICY user_self_policy ON users
  USING (id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
