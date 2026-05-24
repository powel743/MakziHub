-- Migration 014: Create import_sessions for CSV bulk import tracking
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'complete', 'failed');

CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status import_status NOT NULL DEFAULT 'pending',
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  job_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_sessions_agency_id ON import_sessions (agency_id);
CREATE INDEX idx_import_sessions_status ON import_sessions (status);

CREATE TRIGGER import_sessions_updated_at
  BEFORE UPDATE ON import_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
