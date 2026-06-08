-- Migration 017: Lister ID verifications
-- NOTE: The codebase tracks verified state via lister_profiles.id_verified (badge
-- source) + listings.verified_tier. There is no users.verified_tier column, so the
-- review workflow lives in this verifications table, and a lightweight
-- verification_status column on lister_profiles drives the lister-facing UI.

CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE id_doc_type AS ENUM ('national_id', 'passport', 'driving_licence');

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id_type id_doc_type NOT NULL,
  front_url TEXT NOT NULL,
  back_url TEXT,
  status verification_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_verifications_user_id ON verifications (user_id);
CREATE INDEX idx_verifications_status ON verifications (status);

-- UI state machine value: 'unverified' | 'pending' | 'verified' | 'rejected'
ALTER TABLE lister_profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';
