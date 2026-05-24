-- Migration 015: Row Level Security Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lister_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role from JWT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'role',
    ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's ID from JWT
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
  )::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- users
CREATE POLICY users_read_own ON users FOR SELECT
  USING (id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY users_admin_all ON users FOR ALL
  USING (current_user_role() = 'admin');

-- tenant_profiles
CREATE POLICY tenant_profiles_own ON tenant_profiles FOR ALL
  USING (user_id = current_user_id() OR current_user_role() = 'admin');

-- lister_profiles
CREATE POLICY lister_profiles_own ON lister_profiles FOR ALL
  USING (user_id = current_user_id() OR current_user_role() = 'admin');

-- agencies
CREATE POLICY agencies_public_read ON agencies FOR SELECT
  USING (true);

CREATE POLICY agencies_owner_write ON agencies FOR UPDATE
  USING (owner_user_id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY agencies_insert_own ON agencies FOR INSERT
  WITH CHECK (owner_user_id = current_user_id());

CREATE POLICY agencies_admin_delete ON agencies FOR DELETE
  USING (current_user_role() = 'admin');

-- agency_members
CREATE POLICY agency_members_agency_admin ON agency_members FOR ALL
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_user_id = current_user_id()
    )
    OR current_user_role() = 'admin'
  );

CREATE POLICY agency_members_self_read ON agency_members FOR SELECT
  USING (user_id = current_user_id());

-- listings — public read for available listings, NO contact details via RLS (enforced at API layer)
CREATE POLICY listings_public_read ON listings FOR SELECT
  USING (status = 'available' OR lister_user_id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY listings_lister_insert ON listings FOR INSERT
  WITH CHECK (lister_user_id = current_user_id());

CREATE POLICY listings_lister_update ON listings FOR UPDATE
  USING (lister_user_id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY listings_lister_delete ON listings FOR DELETE
  USING (lister_user_id = current_user_id() OR current_user_role() = 'admin');

-- listing_photos — public read
CREATE POLICY listing_photos_public_read ON listing_photos FOR SELECT
  USING (true);

CREATE POLICY listing_photos_lister_write ON listing_photos FOR ALL
  USING (
    listing_id IN (SELECT id FROM listings WHERE lister_user_id = current_user_id())
    OR current_user_role() = 'admin'
  );

-- listing_amenities — public read
CREATE POLICY listing_amenities_public_read ON listing_amenities FOR SELECT
  USING (true);

CREATE POLICY listing_amenities_lister_write ON listing_amenities FOR ALL
  USING (
    listing_id IN (SELECT id FROM listings WHERE lister_user_id = current_user_id())
    OR current_user_role() = 'admin'
  );

-- payments — own only
CREATE POLICY payments_own ON payments FOR ALL
  USING (user_id = current_user_id() OR current_user_role() = 'admin');

-- inquiries — own only
CREATE POLICY inquiries_own ON inquiries FOR ALL
  USING (tenant_user_id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY inquiries_lister_read ON inquiries FOR SELECT
  USING (
    listing_id IN (SELECT id FROM listings WHERE lister_user_id = current_user_id())
  );

-- reviews — public read, tenant write own
CREATE POLICY reviews_public_read ON reviews FOR SELECT
  USING (true);

CREATE POLICY reviews_tenant_write ON reviews FOR INSERT
  WITH CHECK (tenant_user_id = current_user_id());

CREATE POLICY reviews_admin_delete ON reviews FOR DELETE
  USING (current_user_role() = 'admin');

-- saved_listings — own only
CREATE POLICY saved_listings_own ON saved_listings FOR ALL
  USING (tenant_user_id = current_user_id() OR current_user_role() = 'admin');

-- boosts — lister own or admin
CREATE POLICY boosts_lister_own ON boosts FOR ALL
  USING (lister_user_id = current_user_id() OR current_user_role() = 'admin');

-- search_alerts — own only
CREATE POLICY search_alerts_own ON search_alerts FOR ALL
  USING (tenant_user_id = current_user_id() OR current_user_role() = 'admin');

-- fraud_reports — reporter can read own, admins read all
CREATE POLICY fraud_reports_reporter_read ON fraud_reports FOR SELECT
  USING (reporter_user_id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY fraud_reports_insert ON fraud_reports FOR INSERT
  WITH CHECK (reporter_user_id = current_user_id());

CREATE POLICY fraud_reports_admin_write ON fraud_reports FOR UPDATE
  USING (current_user_role() = 'admin');

-- notifications — own only
CREATE POLICY notifications_own ON notifications FOR ALL
  USING (user_id = current_user_id() OR current_user_role() = 'admin');

-- escrow_deposits — own only
CREATE POLICY escrow_own ON escrow_deposits FOR ALL
  USING (tenant_user_id = current_user_id() OR current_user_role() = 'admin');

-- import_sessions — agency admin only
CREATE POLICY import_sessions_agency ON import_sessions FOR ALL
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_user_id = current_user_id()
    )
    OR current_user_role() = 'admin'
  );
