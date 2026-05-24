-- Migration 013: Create escrow_deposits table (Phase 2 — feature-flagged)
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded');

CREATE TABLE escrow_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  amount_ksh INTEGER NOT NULL CHECK (amount_ksh > 0),
  status escrow_status NOT NULL DEFAULT 'held',
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrow_deposits_tenant_user_id ON escrow_deposits (tenant_user_id);
CREATE INDEX idx_escrow_deposits_listing_id ON escrow_deposits (listing_id);
CREATE INDEX idx_escrow_deposits_status ON escrow_deposits (status);

CREATE TRIGGER escrow_deposits_updated_at
  BEFORE UPDATE ON escrow_deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
