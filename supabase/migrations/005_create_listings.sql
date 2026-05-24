-- Migration 005: Create listings table
CREATE TYPE listing_status AS ENUM ('available', 'taken', 'suspended', 'expired');
CREATE TYPE verified_tier AS ENUM ('none', 'phone', 'id', 'visited');
CREATE TYPE house_type AS ENUM (
  'Bedsitter', 'Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom',
  '4+ Bedroom', 'Maisonette', 'Townhouse', 'Bungalow', 'Servant Quarter (SQ)'
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lister_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  estate TEXT NOT NULL,
  area TEXT,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  rent_ksh INTEGER NOT NULL CHECK (rent_ksh > 0),
  deposit_ksh INTEGER CHECK (deposit_ksh >= 0),
  house_type house_type NOT NULL,
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
  size_sqft INTEGER,
  available_from DATE NOT NULL,
  status listing_status NOT NULL DEFAULT 'available',
  verified_tier verified_tier NOT NULL DEFAULT 'none',
  featured_until TIMESTAMPTZ,
  saved_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_lister_user_id ON listings (lister_user_id);
CREATE INDEX idx_listings_agency_id ON listings (agency_id);
CREATE INDEX idx_listings_estate ON listings (estate);
CREATE INDEX idx_listings_status ON listings (status);
CREATE INDEX idx_listings_house_type ON listings (house_type);
CREATE INDEX idx_listings_bedrooms ON listings (bedrooms);
CREATE INDEX idx_listings_rent_ksh ON listings (rent_ksh);
CREATE INDEX idx_listings_featured_until ON listings (featured_until);
CREATE INDEX idx_listings_available_from ON listings (available_from);

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
