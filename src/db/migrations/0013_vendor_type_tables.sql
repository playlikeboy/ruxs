-- 0013: one vendor type per merchant, and separate tables per type.
-- Every vendor is exactly one of: tiffin, water, milk, gifts, store, fitness, physio, mehndi, kids.
-- Profile tables (1:1 with vendors) and item tables (1:1 with products / services) hold the
-- type-specific fields. Triggers stop a vendor from writing into another type's tables.
-- Existing rows are copied in; nothing is dropped.

-- 1. Fill missing categories on older vendors, from their slug or their catalogue.
UPDATE vendors SET category_id = 'mehndi' WHERE category_id IS NULL AND slug LIKE '%mehndi%';
UPDATE vendors SET category_id = 'gifts' WHERE category_id IS NULL AND slug LIKE '%gift%';
UPDATE vendors v SET category_id = 'kids'
  WHERE v.category_id IS NULL AND v.business_type = 'booking'
    AND (v.slug LIKE '%kids%' OR EXISTS (SELECT 1 FROM kids_provider_profiles k WHERE k.vendor_id = v.id));
UPDATE vendors v SET category_id = 'kids-kits'
  WHERE v.category_id IS NULL AND v.business_type = 'delivery'
    AND (v.slug LIKE '%kids%' OR EXISTS (SELECT 1 FROM products p WHERE p.vendor_id = v.id AND p.kind = 'kids-kits'));
UPDATE vendors v SET category_id = (SELECT p.kind FROM products p WHERE p.vendor_id = v.id ORDER BY p.created_at LIMIT 1)
  WHERE v.category_id IS NULL AND v.business_type = 'delivery'
    AND EXISTS (SELECT 1 FROM products p JOIN categories c ON c.id = p.kind WHERE p.vendor_id = v.id);
UPDATE vendors v SET category_id = (SELECT s.category_id FROM services s WHERE s.vendor_id = v.id ORDER BY s.created_at LIMIT 1)
  WHERE v.category_id IS NULL AND v.business_type = 'booking'
    AND EXISTS (SELECT 1 FROM services s WHERE s.vendor_id = v.id);

-- 2. The schema type on categories (admin-created categories map to one) and on vendors.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS vendor_type text;
UPDATE categories SET vendor_type = CASE
    WHEN id IN ('tiffin', 'water', 'milk', 'gifts', 'fitness', 'physio', 'mehndi', 'kids') THEN id
    WHEN fulfilment = 'booking' THEN 'fitness'
    ELSE 'store' END
  WHERE vendor_type IS NULL;
ALTER TABLE categories ALTER COLUMN vendor_type SET DEFAULT 'store';
ALTER TABLE categories ALTER COLUMN vendor_type SET NOT NULL;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_vendor_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_vendor_type_check
  CHECK (vendor_type IN ('tiffin', 'water', 'milk', 'gifts', 'store', 'fitness', 'physio', 'mehndi', 'kids'));

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type text;
UPDATE vendors v SET vendor_type = c.vendor_type FROM categories c WHERE c.id = v.category_id AND v.vendor_type IS NULL;
UPDATE vendors SET vendor_type = CASE WHEN business_type = 'booking' THEN 'fitness' ELSE 'store' END WHERE vendor_type IS NULL;
-- Business type follows the vendor type, so the two can never disagree.
UPDATE vendors SET business_type = CASE WHEN vendor_type IN ('fitness', 'physio', 'mehndi', 'kids') THEN 'booking' ELSE 'delivery' END;
-- Older code paths (and the live worker during deploy) may insert a vendor without a type:
-- fill it from the category so the NOT NULL never breaks onboarding.
CREATE OR REPLACE FUNCTION ruxs_fill_vendor_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.vendor_type IS NULL THEN
    SELECT c.vendor_type INTO NEW.vendor_type FROM categories c WHERE c.id = NEW.category_id;
    NEW.vendor_type := coalesce(NEW.vendor_type, CASE WHEN NEW.business_type = 'booking' THEN 'fitness' ELSE 'store' END);
  END IF;
  NEW.business_type := CASE WHEN NEW.vendor_type IN ('fitness', 'physio', 'mehndi', 'kids') THEN 'booking' ELSE 'delivery' END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vendors_fill_type ON vendors;
CREATE TRIGGER vendors_fill_type BEFORE INSERT OR UPDATE OF vendor_type, business_type ON vendors FOR EACH ROW EXECUTE FUNCTION ruxs_fill_vendor_type();
ALTER TABLE vendors ALTER COLUMN vendor_type SET NOT NULL;
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_vendor_type_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_vendor_type_check
  CHECK (vendor_type IN ('tiffin', 'water', 'milk', 'gifts', 'store', 'fitness', 'physio', 'mehndi', 'kids'));
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_business_type_matches_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_business_type_matches_check
  CHECK ((vendor_type IN ('fitness', 'physio', 'mehndi', 'kids')) = (business_type = 'booking'));
CREATE INDEX IF NOT EXISTS vendors_vendor_type_idx ON vendors (vendor_type, status);

-- Item tables reference (product id, vendor id) so an item can only belong to its own vendor.
CREATE UNIQUE INDEX IF NOT EXISTS products_id_vendor_idx ON products (id, vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS services_id_vendor_idx ON services (id, vendor_id);

-- 3. Guard: a row may only be written for a vendor of the listed types.
CREATE OR REPLACE FUNCTION ruxs_assert_vendor_type() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t text;
BEGIN
  SELECT vendor_type INTO t FROM vendors WHERE id = NEW.vendor_id;
  IF t IS NULL OR NOT (t = ANY (TG_ARGV)) THEN
    RAISE EXCEPTION 'A % vendor cannot write to %', coalesce(t, 'unknown'), TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

-- 4. Profile tables, one per vendor type.
CREATE TABLE IF NOT EXISTS tiffin_kitchens (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  diet text NOT NULL DEFAULT 'veg' CHECK (diet IN ('veg', 'jain', 'egg', 'non_veg', 'mixed')),
  cuisines text[] NOT NULL DEFAULT '{}',
  meal_slots text[] NOT NULL DEFAULT '{lunch,dinner}',
  weekly_off text[] NOT NULL DEFAULT '{}',
  trial_meal_paise integer CHECK (trial_meal_paise IS NULL OR trial_meal_paise >= 0),
  dabba_type text NOT NULL DEFAULT 'steel' CHECK (dabba_type IN ('steel', 'disposable', 'eco')),
  fssai_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS water_suppliers (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  water_source text NOT NULL DEFAULT 'ro' CHECK (water_source IN ('ro', 'mineral', 'spring', 'alkaline')),
  brands text[] NOT NULL DEFAULT '{}',
  tds_ppm integer CHECK (tds_ppm IS NULL OR tds_ppm BETWEEN 0 AND 2000),
  bis_license text,
  upper_floor_delivery boolean NOT NULL DEFAULT true,
  same_day_delivery boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dairy_farms (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'own_farm' CHECK (source IN ('own_farm', 'cooperative', 'brand', 'collection_centre')),
  animals text[] NOT NULL DEFAULT '{cow}',
  packaging text NOT NULL DEFAULT 'pouch' CHECK (packaging IN ('pouch', 'glass_bottle', 'can', 'loose')),
  morning_delivery_by text NOT NULL DEFAULT '07:00',
  evening_delivery boolean NOT NULL DEFAULT false,
  fssai_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_studios (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  occasions text[] NOT NULL DEFAULT '{}',
  customisation boolean NOT NULL DEFAULT true,
  min_lead_days integer NOT NULL DEFAULT 1 CHECK (min_lead_days BETWEEN 0 AND 60),
  gift_wrap_paise integer NOT NULL DEFAULT 0 CHECK (gift_wrap_paise >= 0),
  ships_outside_city boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retail_stores (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  store_kind text NOT NULL DEFAULT 'general' CHECK (store_kind IN ('general', 'grocery', 'stationery', 'kids_kits', 'pharmacy', 'other')),
  gstin text,
  opens_at text,
  closes_at text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fitness_trainers (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  certifications text,
  experience_years integer CHECK (experience_years IS NULL OR experience_years BETWEEN 0 AND 60),
  specialities text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  gender text CHECK (gender IS NULL OR gender IN ('female', 'male', 'other')),
  gym_name text,
  gym_address text,
  women_only_slots boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS physio_clinics (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  registration_number text,
  experience_years integer CHECK (experience_years IS NULL OR experience_years BETWEEN 0 AND 60),
  specialities text[] NOT NULL DEFAULT '{}',
  conditions_treated text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  gender text CHECK (gender IS NULL OR gender IN ('female', 'male', 'other')),
  clinic_name text,
  clinic_address text,
  home_visits boolean NOT NULL DEFAULT true,
  home_visit_fee_paise integer NOT NULL DEFAULT 0 CHECK (home_visit_fee_paise >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mehndi_artists (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  experience_years integer CHECK (experience_years IS NULL OR experience_years BETWEEN 0 AND 60),
  styles text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  gender text CHECK (gender IS NULL OR gender IN ('female', 'male', 'other')),
  organic_henna boolean NOT NULL DEFAULT true,
  team_size integer NOT NULL DEFAULT 1 CHECK (team_size BETWEEN 1 AND 50),
  travel_fee_paise integer NOT NULL DEFAULT 0 CHECK (travel_fee_paise >= 0),
  bridal_advance_days integer NOT NULL DEFAULT 7 CHECK (bridal_advance_days BETWEEN 0 AND 180),
  portfolio_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Item tables, one per type that sells something different.
CREATE TABLE IF NOT EXISTS tiffin_meals (
  product_id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  meal_type text NOT NULL DEFAULT 'lunch' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  diet text NOT NULL DEFAULT 'veg' CHECK (diet IN ('veg', 'jain', 'egg', 'non_veg')),
  cuisine text,
  items_included text,
  spice_level text NOT NULL DEFAULT 'medium' CHECK (spice_level IN ('mild', 'medium', 'spicy')),
  calories integer CHECK (calories IS NULL OR calories BETWEEN 0 AND 5000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, vendor_id) REFERENCES products(id, vendor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS water_cans (
  product_id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  volume_ml integer NOT NULL DEFAULT 20000 CHECK (volume_ml BETWEEN 100 AND 50000),
  pack_size integer NOT NULL DEFAULT 1 CHECK (pack_size BETWEEN 1 AND 100),
  container text NOT NULL DEFAULT 'can' CHECK (container IN ('can', 'jar', 'bottle_pack', 'dispenser')),
  returnable boolean NOT NULL DEFAULT false,
  chilled boolean NOT NULL DEFAULT false,
  brand text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, vendor_id) REFERENCES products(id, vendor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dairy_items (
  product_id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'milk' CHECK (item_type IN ('milk', 'curd', 'paneer', 'ghee', 'butter', 'buttermilk', 'other')),
  animal text CHECK (animal IS NULL OR animal IN ('cow', 'buffalo', 'a2_cow', 'goat', 'mixed')),
  quantity integer CHECK (quantity IS NULL OR quantity > 0),
  unit text NOT NULL DEFAULT 'ml' CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pcs')),
  fat_percent_x10 integer CHECK (fat_percent_x10 IS NULL OR fat_percent_x10 BETWEEN 0 AND 1000),
  packaging text NOT NULL DEFAULT 'pouch' CHECK (packaging IN ('pouch', 'glass_bottle', 'can', 'loose', 'cup', 'jar')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, vendor_id) REFERENCES products(id, vendor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gift_items (
  product_id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  occasion text,
  customisable boolean NOT NULL DEFAULT false,
  personalisation_hint text,
  lead_days integer NOT NULL DEFAULT 1 CHECK (lead_days BETWEEN 0 AND 60),
  gift_wrap boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, vendor_id) REFERENCES products(id, vendor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fitness_packages (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  package_type text NOT NULL DEFAULT 'single' CHECK (package_type IN ('trial', 'single', 'pack', 'monthly')),
  sessions_included integer NOT NULL DEFAULT 1 CHECK (sessions_included BETWEEN 1 AND 100),
  validity_days integer CHECK (validity_days IS NULL OR validity_days BETWEEN 1 AND 365),
  level text NOT NULL DEFAULT 'all' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  focus text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS physio_treatments (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  treatment_type text NOT NULL DEFAULT 'session' CHECK (treatment_type IN ('assessment', 'session', 'package', 'consultation')),
  conditions text[] NOT NULL DEFAULT '{}',
  sessions_included integer NOT NULL DEFAULT 1 CHECK (sessions_included BETWEEN 1 AND 100),
  equipment text,
  requires_prescription boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mehndi_packages (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  style text NOT NULL DEFAULT 'arabic' CHECK (style IN ('bridal', 'arabic', 'rajasthani', 'indo_western', 'minimal', 'kids', 'other')),
  coverage text NOT NULL DEFAULT 'both_hands' CHECK (coverage IN ('per_hand', 'both_hands', 'hands_and_feet', 'full_bridal')),
  people_included integer NOT NULL DEFAULT 1 CHECK (people_included BETWEEN 1 AND 50),
  organic boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tiffin_meals_vendor_idx ON tiffin_meals (vendor_id);
CREATE INDEX IF NOT EXISTS water_cans_vendor_idx ON water_cans (vendor_id);
CREATE INDEX IF NOT EXISTS dairy_items_vendor_idx ON dairy_items (vendor_id);
CREATE INDEX IF NOT EXISTS gift_items_vendor_idx ON gift_items (vendor_id);
CREATE INDEX IF NOT EXISTS fitness_packages_vendor_idx ON fitness_packages (vendor_id);
CREATE INDEX IF NOT EXISTS physio_treatments_vendor_idx ON physio_treatments (vendor_id);
CREATE INDEX IF NOT EXISTS mehndi_packages_vendor_idx ON mehndi_packages (vendor_id);

-- 6. Copy existing data into the new tables.
INSERT INTO tiffin_kitchens (vendor_id, diet)
  SELECT v.id, CASE WHEN EXISTS (SELECT 1 FROM products p WHERE p.vendor_id = v.id AND p.is_veg = false) THEN 'mixed' ELSE 'veg' END
  FROM vendors v WHERE v.vendor_type = 'tiffin' ON CONFLICT DO NOTHING;
INSERT INTO water_suppliers (vendor_id) SELECT id FROM vendors WHERE vendor_type = 'water' ON CONFLICT DO NOTHING;
INSERT INTO dairy_farms (vendor_id) SELECT id FROM vendors WHERE vendor_type = 'milk' ON CONFLICT DO NOTHING;
INSERT INTO gift_studios (vendor_id) SELECT id FROM vendors WHERE vendor_type = 'gifts' ON CONFLICT DO NOTHING;
INSERT INTO retail_stores (vendor_id, store_kind)
  SELECT id, CASE WHEN category_id = 'kids-kits' THEN 'kids_kits' ELSE 'general' END FROM vendors WHERE vendor_type = 'store' ON CONFLICT DO NOTHING;

INSERT INTO fitness_trainers (vendor_id, headline, certifications, experience_years, specialities, languages, gender)
  SELECT v.id, p.headline, p.qualifications, p.experience_years, coalesce(p.specialities, '{}'), coalesce(p.languages, '{}'), p.gender
  FROM vendors v LEFT JOIN provider_profiles p ON p.vendor_id = v.id WHERE v.vendor_type = 'fitness' ON CONFLICT DO NOTHING;
INSERT INTO physio_clinics (vendor_id, headline, qualifications, experience_years, specialities, languages, gender)
  SELECT v.id, p.headline, p.qualifications, p.experience_years, coalesce(p.specialities, '{}'), coalesce(p.languages, '{}'), p.gender
  FROM vendors v LEFT JOIN provider_profiles p ON p.vendor_id = v.id WHERE v.vendor_type = 'physio' ON CONFLICT DO NOTHING;
INSERT INTO mehndi_artists (vendor_id, headline, experience_years, styles, languages, gender)
  SELECT v.id, p.headline, p.experience_years, coalesce(p.specialities, '{}'), coalesce(p.languages, '{}'), p.gender
  FROM vendors v LEFT JOIN provider_profiles p ON p.vendor_id = v.id WHERE v.vendor_type = 'mehndi' ON CONFLICT DO NOTHING;
INSERT INTO kids_provider_profiles (vendor_id, headline, qualifications, experience_years, specialties, languages)
  SELECT v.id, p.headline, p.qualifications, coalesce(p.experience_years, 0), coalesce(p.specialities, '{}'), coalesce(p.languages, '{}')
  FROM vendors v LEFT JOIN provider_profiles p ON p.vendor_id = v.id WHERE v.vendor_type = 'kids' ON CONFLICT DO NOTHING;

INSERT INTO tiffin_meals (product_id, vendor_id, meal_type, diet)
  SELECT p.id, p.vendor_id,
    CASE p.shift WHEN 'morning' THEN 'breakfast' WHEN 'evening' THEN 'snacks' ELSE p.shift END,
    CASE WHEN p.is_veg = false THEN 'non_veg' WHEN p.name ILIKE '%jain%' THEN 'jain' ELSE 'veg' END
  FROM products p JOIN vendors v ON v.id = p.vendor_id WHERE v.vendor_type = 'tiffin' ON CONFLICT DO NOTHING;

INSERT INTO water_cans (product_id, vendor_id, volume_ml, pack_size, container, returnable, chilled)
  SELECT p.id, p.vendor_id,
    least(50000, greatest(100, coalesce((substring(p.name FROM '(\d+)\s*[Ll]'))::int * 1000, 20000))),
    coalesce((substring(p.name FROM '\((\d+)\s*pack'))::int, 1),
    CASE WHEN p.name ILIKE '%bottle%' THEN 'bottle_pack' WHEN p.name ILIKE '%jar%' THEN 'jar' ELSE 'can' END,
    p.deposit_paise > 0 OR p.asset_name IS NOT NULL,
    p.name ILIKE '%chill%'
  FROM products p JOIN vendors v ON v.id = p.vendor_id WHERE v.vendor_type = 'water' ON CONFLICT DO NOTHING;

INSERT INTO dairy_items (product_id, vendor_id, item_type, animal, quantity, unit, packaging)
  SELECT p.id, p.vendor_id,
    CASE WHEN p.name ~* '(dahi|curd)' THEN 'curd' WHEN p.name ~* 'paneer' THEN 'paneer' WHEN p.name ~* 'ghee' THEN 'ghee'
         WHEN p.name ~* 'butter ?milk|chaas' THEN 'buttermilk' WHEN p.name ~* 'butter' THEN 'butter' WHEN p.name ~* 'milk' THEN 'milk' ELSE 'other' END,
    CASE WHEN p.name ~* 'buffalo' THEN 'buffalo' WHEN p.name ~* 'a2' THEN 'a2_cow' WHEN p.name ~* 'cow' THEN 'cow' ELSE NULL END,
    (substring(p.name FROM '(?i)(\d+)\s*(?:ml|kg|g|l)\M'))::int,
    lower(coalesce(substring(p.name FROM '(?i)\d+\s*(ml|kg|g|l)\M'), 'pcs')),
    CASE WHEN p.name ILIKE '%glass%' THEN 'glass_bottle' WHEN p.name ~* '(dahi|curd)' THEN 'cup' WHEN p.name ~* 'ghee' THEN 'jar' ELSE 'pouch' END
  FROM products p JOIN vendors v ON v.id = p.vendor_id WHERE v.vendor_type = 'milk' ON CONFLICT DO NOTHING;

INSERT INTO gift_items (product_id, vendor_id, customisable)
  SELECT p.id, p.vendor_id, p.name ~* '(custom|personali[sz]ed|name|photo)'
  FROM products p JOIN vendors v ON v.id = p.vendor_id WHERE v.vendor_type = 'gifts' ON CONFLICT DO NOTHING;

INSERT INTO fitness_packages (service_id, vendor_id, package_type)
  SELECT s.id, s.vendor_id, CASE WHEN s.name ILIKE '%trial%' THEN 'trial' ELSE 'single' END
  FROM services s JOIN vendors v ON v.id = s.vendor_id WHERE v.vendor_type = 'fitness' ON CONFLICT DO NOTHING;

INSERT INTO physio_treatments (service_id, vendor_id, treatment_type)
  SELECT s.id, s.vendor_id,
    CASE WHEN s.name ILIKE '%consult%' THEN 'consultation' WHEN s.name ILIKE '%assess%' THEN 'assessment' ELSE 'session' END
  FROM services s JOIN vendors v ON v.id = s.vendor_id WHERE v.vendor_type = 'physio' ON CONFLICT DO NOTHING;

INSERT INTO mehndi_packages (service_id, vendor_id, style, coverage)
  SELECT s.id, s.vendor_id,
    CASE WHEN s.name ILIKE '%bridal%' THEN 'bridal' WHEN s.name ILIKE '%arabic%' THEN 'arabic' WHEN s.name ILIKE '%rajasthani%' THEN 'rajasthani' ELSE 'other' END,
    CASE WHEN s.name ILIKE '%bridal%' THEN 'full_bridal' WHEN s.name ILIKE '%feet%' THEN 'hands_and_feet' WHEN s.name ILIKE '%per hand%' THEN 'per_hand' ELSE 'both_hands' END
  FROM services s JOIN vendors v ON v.id = s.vendor_id WHERE v.vendor_type = 'mehndi' ON CONFLICT DO NOTHING;

-- Kids academies keep their classes in kids_services. Copy their older generic services across, then archive the originals.
INSERT INTO kids_services (id, vendor_id, category_id, title, slug, description, image_url, duration_minutes, delivery_modes, price_paise)
  SELECT gen_random_uuid()::text, s.vendor_id,
    CASE WHEN v.slug ~ '(robo|stem|science|code)' THEN 'stem' WHEN v.slug ~ '(art|craft|picasso|clay)' THEN 'art-craft'
         WHEN v.slug ~ '(dance|music)' THEN 'performing-arts' WHEN v.slug ~ 'chess' THEN 'life-skills' ELSE 'holiday' END,
    s.name,
    trim(both '-' from regexp_replace(lower(s.name), '[^a-z0-9]+', '-', 'g')) || '-' || left(s.id, 6),
    s.description, s.image_url, s.duration_minutes, s.modes, s.price_paise
  FROM services s JOIN vendors v ON v.id = s.vendor_id
  WHERE v.vendor_type = 'kids' AND s.archived_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM kids_services k WHERE k.vendor_id = s.vendor_id AND lower(k.title) = lower(s.name));
UPDATE services s SET archived_at = now(), is_active = false
  FROM vendors v WHERE v.id = s.vendor_id AND v.vendor_type = 'kids' AND s.archived_at IS NULL;

-- 7. Turn the guards on (after the copy, so existing data is never blocked).
DROP TRIGGER IF EXISTS tiffin_kitchens_type ON tiffin_kitchens;
CREATE TRIGGER tiffin_kitchens_type BEFORE INSERT OR UPDATE OF vendor_id ON tiffin_kitchens FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('tiffin');
DROP TRIGGER IF EXISTS water_suppliers_type ON water_suppliers;
CREATE TRIGGER water_suppliers_type BEFORE INSERT OR UPDATE OF vendor_id ON water_suppliers FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('water');
DROP TRIGGER IF EXISTS dairy_farms_type ON dairy_farms;
CREATE TRIGGER dairy_farms_type BEFORE INSERT OR UPDATE OF vendor_id ON dairy_farms FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('milk');
DROP TRIGGER IF EXISTS gift_studios_type ON gift_studios;
CREATE TRIGGER gift_studios_type BEFORE INSERT OR UPDATE OF vendor_id ON gift_studios FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('gifts');
DROP TRIGGER IF EXISTS retail_stores_type ON retail_stores;
CREATE TRIGGER retail_stores_type BEFORE INSERT OR UPDATE OF vendor_id ON retail_stores FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('store');
DROP TRIGGER IF EXISTS fitness_trainers_type ON fitness_trainers;
CREATE TRIGGER fitness_trainers_type BEFORE INSERT OR UPDATE OF vendor_id ON fitness_trainers FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('fitness');
DROP TRIGGER IF EXISTS physio_clinics_type ON physio_clinics;
CREATE TRIGGER physio_clinics_type BEFORE INSERT OR UPDATE OF vendor_id ON physio_clinics FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('physio');
DROP TRIGGER IF EXISTS mehndi_artists_type ON mehndi_artists;
CREATE TRIGGER mehndi_artists_type BEFORE INSERT OR UPDATE OF vendor_id ON mehndi_artists FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('mehndi');
DROP TRIGGER IF EXISTS kids_provider_profiles_type ON kids_provider_profiles;
CREATE TRIGGER kids_provider_profiles_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_provider_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids');

DROP TRIGGER IF EXISTS tiffin_meals_type ON tiffin_meals;
CREATE TRIGGER tiffin_meals_type BEFORE INSERT OR UPDATE OF vendor_id ON tiffin_meals FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('tiffin');
DROP TRIGGER IF EXISTS water_cans_type ON water_cans;
CREATE TRIGGER water_cans_type BEFORE INSERT OR UPDATE OF vendor_id ON water_cans FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('water');
DROP TRIGGER IF EXISTS dairy_items_type ON dairy_items;
CREATE TRIGGER dairy_items_type BEFORE INSERT OR UPDATE OF vendor_id ON dairy_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('milk');
DROP TRIGGER IF EXISTS gift_items_type ON gift_items;
CREATE TRIGGER gift_items_type BEFORE INSERT OR UPDATE OF vendor_id ON gift_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('gifts');
DROP TRIGGER IF EXISTS fitness_packages_type ON fitness_packages;
CREATE TRIGGER fitness_packages_type BEFORE INSERT OR UPDATE OF vendor_id ON fitness_packages FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('fitness');
DROP TRIGGER IF EXISTS physio_treatments_type ON physio_treatments;
CREATE TRIGGER physio_treatments_type BEFORE INSERT OR UPDATE OF vendor_id ON physio_treatments FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('physio');
DROP TRIGGER IF EXISTS mehndi_packages_type ON mehndi_packages;
CREATE TRIGGER mehndi_packages_type BEFORE INSERT OR UPDATE OF vendor_id ON mehndi_packages FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('mehndi');

-- Shared catalogues: delivery types sell products, booking types sell services, kids academies sell kids classes.
DROP TRIGGER IF EXISTS products_vendor_type ON products;
CREATE TRIGGER products_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON products FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('tiffin', 'water', 'milk', 'gifts', 'store');
DROP TRIGGER IF EXISTS services_vendor_type ON services;
CREATE TRIGGER services_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON services FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('fitness', 'physio', 'mehndi');
DROP TRIGGER IF EXISTS kids_services_vendor_type ON kids_services;
CREATE TRIGGER kids_services_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_services FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids');
DROP TRIGGER IF EXISTS kids_workshops_vendor_type ON kids_workshops;
CREATE TRIGGER kids_workshops_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_workshops FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids');
