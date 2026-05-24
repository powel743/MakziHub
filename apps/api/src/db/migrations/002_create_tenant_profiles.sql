-- Migration 002: Create tenant_profiles table
CREATE TABLE tenant_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_areas TEXT[] DEFAULT '{}',
  max_budget INTEGER,
  free_credits INTEGER NOT NULL DEFAULT 3,
  is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_profiles_user_id ON tenant_profiles (user_id);

CREATE TRIGGER tenant_profiles_updated_at
  BEFORE UPDATE ON tenant_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
