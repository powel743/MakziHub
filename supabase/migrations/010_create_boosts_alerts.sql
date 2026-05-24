-- Migration 010: Create boosts and search_alerts tables
CREATE TABLE boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  lister_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_ksh INTEGER NOT NULL CHECK (amount_ksh > 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boosts_listing_id ON boosts (listing_id);
CREATE INDEX idx_boosts_ends_at ON boosts (ends_at);

CREATE TABLE search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estate TEXT,
  max_rent INTEGER,
  bedrooms INTEGER,
  house_type TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_alerts_tenant_user_id ON search_alerts (tenant_user_id);
CREATE INDEX idx_search_alerts_active ON search_alerts (active);
CREATE INDEX idx_search_alerts_estate ON search_alerts (estate);

CREATE TRIGGER search_alerts_updated_at
  BEFORE UPDATE ON search_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
