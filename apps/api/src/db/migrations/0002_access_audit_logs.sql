CREATE TABLE IF NOT EXISTS access_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_audit_logs_workspace_created
  ON access_audit_logs (workspace_id, created_at DESC);

ALTER TABLE access_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_isolation_access_audit_logs ON access_audit_logs;
CREATE POLICY workspace_isolation_access_audit_logs ON access_audit_logs
  USING (
    workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
    OR workspace_id IS NULL
  );
