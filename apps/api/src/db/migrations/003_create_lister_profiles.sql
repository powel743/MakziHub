-- Migration 003: Create lister_profiles table
CREATE TYPE lister_plan AS ENUM ('free', 'pro', 'business');

CREATE TABLE lister_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_verified BOOLEAN NOT NULL DEFAULT FALSE,
  id_doc_url TEXT,
  id_verified_paid BOOLEAN NOT NULL DEFAULT FALSE,
  plan lister_plan NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lister_profiles_user_id ON lister_profiles (user_id);
CREATE INDEX idx_lister_profiles_plan ON lister_profiles (plan);

CREATE TRIGGER lister_profiles_updated_at
  BEFORE UPDATE ON lister_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
