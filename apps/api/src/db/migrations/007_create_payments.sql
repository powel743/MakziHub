-- Migration 007: Create payments table
CREATE TYPE payment_type AS ENUM ('unlock', 'subscription', 'boost', 'badge', 'escrow', 'credits');
CREATE TYPE payment_status AS ENUM ('pending', 'complete', 'failed', 'refunded', 'timed_out');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type payment_type NOT NULL,
  amount_ksh INTEGER NOT NULL CHECK (amount_ksh > 0),
  mpesa_checkout_id TEXT UNIQUE,
  mpesa_receipt TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_mpesa_checkout_id ON payments (mpesa_checkout_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_type ON payments (type);
CREATE INDEX idx_payments_created_at ON payments (created_at);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
