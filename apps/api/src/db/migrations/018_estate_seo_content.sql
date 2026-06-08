-- Migration 018: Estate SEO content (PRD §9.4 estate landing pages)
-- The estates list lives in the `approved_estates` table (see estates.seed.sql).
ALTER TABLE approved_estates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE approved_estates ADD COLUMN IF NOT EXISTS transport_links TEXT[];
ALTER TABLE approved_estates ADD COLUMN IF NOT EXISTS nearby_schools TEXT[];
ALTER TABLE approved_estates ADD COLUMN IF NOT EXISTS seo_meta_description VARCHAR(160);
