-- Migration 006: Create listing_photos and listing_amenities tables
CREATE TABLE listing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos (listing_id);

CREATE TABLE listing_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amenity TEXT NOT NULL CHECK (amenity IN (
    'water_council', 'water_borehole', 'water_both', 'water_24hr',
    'parking_open', 'parking_covered', 'parking_none',
    'security_guard', 'electric_fence', 'cctv',
    'fibre_wifi', 'generator', 'solar_water_heater',
    'balcony', 'tiled_floors', 'fitted_kitchen', 'ensuite_master',
    'dstv_dish', 'lift_elevator', 'wheelchair_accessible',
    'pet_friendly', 'children_play_area'
  )),
  UNIQUE (listing_id, amenity)
);

CREATE INDEX idx_listing_amenities_listing_id ON listing_amenities (listing_id);
