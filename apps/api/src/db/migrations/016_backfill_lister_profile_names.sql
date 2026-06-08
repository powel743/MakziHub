-- Migration 016: Data hygiene for lister_profiles
-- Context: PATCH /auth/me was upserting lister_profiles without full_name
-- (a NOT NULL column), causing a PostgreSQL constraint violation for any user
-- who registered before this fix was deployed.
--
-- This migration back-fills full_name from tenant_profiles for any lister
-- whose lister_profiles.full_name is empty or null, and ensures no orphaned
-- empty rows remain.

-- Back-fill full_name from tenant_profiles where it's missing
UPDATE lister_profiles lp
SET full_name = tp.full_name
FROM tenant_profiles tp
WHERE tp.user_id = lp.user_id
  AND (lp.full_name IS NULL OR lp.full_name = '');

-- Safety: if any lister_profiles row somehow has a null/empty full_name
-- with no corresponding tenant_profile (edge case), set a fallback.
UPDATE lister_profiles
SET full_name = 'Unknown'
WHERE full_name IS NULL OR full_name = '';
