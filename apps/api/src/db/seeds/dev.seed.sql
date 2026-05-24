-- Dev seed data for local development and testing
-- Run AFTER estates.seed.sql and all migrations

-- Dev admin user (password: Admin1234!)
-- Note: In practice, create users via Supabase Auth. This is for dev convenience.

-- Example lister profile for testing
-- INSERT INTO users (id, email, phone, role, verified_phone) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'admin@makazihub.co.ke', '+254700000001', 'admin', true),
--   ('00000000-0000-0000-0000-000000000002', 'lister@makazihub.co.ke', '+254700000002', 'caretaker', true),
--   ('00000000-0000-0000-0000-000000000003', 'tenant@makazihub.co.ke', '+254700000003', 'tenant', true);

-- INSERT INTO lister_profiles (user_id, full_name, plan) VALUES
--   ('00000000-0000-0000-0000-000000000002', 'John Caretaker', 'pro');

-- INSERT INTO tenant_profiles (user_id, full_name, free_credits) VALUES
--   ('00000000-0000-0000-0000-000000000003', 'Jane Tenant', 3);

-- INSERT INTO listings (lister_user_id, title, estate, address, rent_ksh, deposit_ksh, house_type, bedrooms, bathrooms, available_from, verified_tier) VALUES
--   ('00000000-0000-0000-0000-000000000002', 'Spacious 2BR in Kasarani', 'Kasarani', 'Off Mwiki Road, near Total', 22000, 44000, '2 Bedroom', 2, 1, CURRENT_DATE, 'phone'),
--   ('00000000-0000-0000-0000-000000000002', 'Bedsitter in Westlands', 'Westlands', 'Near Westgate Mall', 15000, 15000, 'Bedsitter', 0, 1, CURRENT_DATE, 'phone');

SELECT 'Dev seed file loaded. Uncomment inserts above to populate dev data.' AS message;
