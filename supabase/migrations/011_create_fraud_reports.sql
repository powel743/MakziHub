-- Migration 011: Create fraud_reports table
CREATE TYPE fraud_reason AS ENUM ('fraud', 'misleading', 'already_taken', 'other');

CREATE TABLE fraud_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason fraud_reason NOT NULL,
  note TEXT,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_action TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_reports_listing_id ON fraud_reports (listing_id);
CREATE INDEX idx_fraud_reports_reporter_user_id ON fraud_reports (reporter_user_id);
CREATE INDEX idx_fraud_reports_resolved ON fraud_reports (resolved);
