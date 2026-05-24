-- Seed: Approved Nairobi Estates (Phase 1)
-- This table is referenced for validation of listing estates
CREATE TABLE IF NOT EXISTS approved_estates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO approved_estates (name, slug) VALUES
  ('Kasarani', 'kasarani'),
  ('Ruaka', 'ruaka'),
  ('Westlands', 'westlands'),
  ('Kilimani', 'kilimani'),
  ('Embakasi', 'embakasi'),
  ('Donholm', 'donholm'),
  ('Umoja', 'umoja'),
  ('Githurai', 'githurai'),
  ('Roysambu', 'roysambu'),
  ('South B', 'south-b'),
  ('South C', 'south-c'),
  ('Ngong Road', 'ngong-road'),
  ('Rongai', 'rongai'),
  ('Thika Road', 'thika-road'),
  ('Kiambu Road', 'kiambu-road'),
  ('Kikuyu', 'kikuyu'),
  ('Kahawa', 'kahawa'),
  ('Zimmerman', 'zimmerman'),
  ('Pipeline', 'pipeline'),
  ('Mathare', 'mathare'),
  ('Pangani', 'pangani'),
  ('Parklands', 'parklands'),
  ('Lavington', 'lavington'),
  ('Karen', 'karen'),
  ('Langata', 'langata'),
  ('Industrial Area', 'industrial-area'),
  ('Eastleigh', 'eastleigh'),
  ('Buruburu', 'buruburu'),
  ('Kayole', 'kayole'),
  ('Komarock', 'komarock')
ON CONFLICT (name) DO NOTHING;
