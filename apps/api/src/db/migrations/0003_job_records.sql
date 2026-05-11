CREATE TABLE IF NOT EXISTS job_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_records_workspace_created
  ON job_records (workspace_id, created_at DESC);

ALTER TABLE job_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_isolation_job_records ON job_records;
CREATE POLICY workspace_isolation_job_records ON job_records
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);
