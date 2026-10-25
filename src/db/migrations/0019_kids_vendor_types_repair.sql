-- 0019: make kids vendors creatable.
-- Kids vendor types use underscore ids (kids_stem…), but categories_id_check (0004)
-- only allowed [a-z0-9-], so the kids category row could never be inserted and every
-- kids vendor failed on vendors_category_id_fkey. This widens that check, re-applies
-- 0014's idempotent body (in case it was only recorded), and seeds the 10 kids categories.
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_id_check;
ALTER TABLE categories ADD CONSTRAINT categories_id_check CHECK (id ~ '^[a-z0-9_-]+$');

-- 1. Update check constraints on categories and vendors
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_vendor_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_vendor_type_check
  CHECK (vendor_type IN (
    'tiffin', 'water', 'milk', 'gifts', 'store', 'fitness', 'physio', 'mehndi', 'kids',
    'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
    'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills',
    'kids_products', 'kids_institutions'
  ));

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_vendor_type_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_vendor_type_check
  CHECK (vendor_type IN (
    'tiffin', 'water', 'milk', 'gifts', 'store', 'fitness', 'physio', 'mehndi', 'kids',
    'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
    'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills',
    'kids_products', 'kids_institutions'
  ));

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_business_type_matches_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_business_type_matches_check
  CHECK (
    (vendor_type IN (
      'fitness', 'physio', 'mehndi', 'kids',
      'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
      'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills',
      'kids_institutions'
    )) = (business_type = 'booking')
  );

-- Update trigger function
CREATE OR REPLACE FUNCTION ruxs_fill_vendor_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.vendor_type IS NULL THEN
    SELECT c.vendor_type INTO NEW.vendor_type FROM categories c WHERE c.id = NEW.category_id;
    NEW.vendor_type := coalesce(NEW.vendor_type, CASE WHEN NEW.business_type = 'booking' THEN 'fitness' ELSE 'store' END);
  END IF;
  NEW.business_type := CASE
    WHEN NEW.vendor_type IN (
      'fitness', 'physio', 'mehndi', 'kids',
      'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
      'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills',
      'kids_institutions'
    ) THEN 'booking'
    ELSE 'delivery'
  END;
  RETURN NEW;
END $$;

-- 2. Create the 10 Kids Profile Tables
CREATE TABLE IF NOT EXISTS kids_academics_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  subjects text[] NOT NULL DEFAULT '{}',
  target_classes text[] NOT NULL DEFAULT '{}',
  board text NOT NULL DEFAULT 'all',
  home_tuition_available boolean NOT NULL DEFAULT true,
  guardian_supervision_required boolean NOT NULL DEFAULT true,
  id_proof_verified boolean NOT NULL DEFAULT false,
  police_verification boolean NOT NULL DEFAULT false,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_stem_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  disciplines text[] NOT NULL DEFAULT '{}',
  tools_used text[] NOT NULL DEFAULT '{}',
  kit_provided boolean NOT NULL DEFAULT true,
  lab_equipped boolean NOT NULL DEFAULT false,
  home_tuition_available boolean NOT NULL DEFAULT true,
  guardian_supervision_required boolean NOT NULL DEFAULT true,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_performing_arts_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  art_forms text[] NOT NULL DEFAULT '{}',
  dance_styles text[] NOT NULL DEFAULT '{}',
  instruments text[] NOT NULL DEFAULT '{}',
  stage_experience_years integer NOT NULL DEFAULT 0,
  home_tuition_available boolean NOT NULL DEFAULT true,
  guardian_supervision_required boolean NOT NULL DEFAULT true,
  audition_prep boolean NOT NULL DEFAULT false,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_arts_crafts_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  craft_mediums text[] NOT NULL DEFAULT '{}',
  materials_included boolean NOT NULL DEFAULT true,
  exhibitions_held integer NOT NULL DEFAULT 0,
  home_tuition_available boolean NOT NULL DEFAULT true,
  guardian_supervision_required boolean NOT NULL DEFAULT true,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_school_projects_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  project_categories text[] NOT NULL DEFAULT '{}',
  turnaround_days integer NOT NULL DEFAULT 3,
  custom_models boolean NOT NULL DEFAULT true,
  express_delivery boolean NOT NULL DEFAULT false,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  sample_projects_video_url text,
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_camps_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  camp_themes text[] NOT NULL DEFAULT '{}',
  min_age integer NOT NULL DEFAULT 4,
  max_age integer NOT NULL DEFAULT 14,
  batch_capacity integer NOT NULL DEFAULT 15,
  first_aid_certified boolean NOT NULL DEFAULT true,
  venue_address text,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_sports_fitness_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  activity_types text[] NOT NULL DEFAULT '{}',
  fide_rating integer,
  coaching_level text NOT NULL DEFAULT 'all',
  equipment_provided boolean NOT NULL DEFAULT true,
  home_tuition_available boolean NOT NULL DEFAULT false,
  guardian_supervision_required boolean NOT NULL DEFAULT true,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_life_skills_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  qualifications text,
  experience_years integer NOT NULL DEFAULT 0,
  skill_domains text[] NOT NULL DEFAULT '{}',
  interactive_sessions boolean NOT NULL DEFAULT true,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_products_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  store_kind text NOT NULL DEFAULT 'kids_kits',
  product_kinds text[] NOT NULL DEFAULT '{}',
  rental_available boolean NOT NULL DEFAULT false,
  non_toxic_certified boolean NOT NULL DEFAULT true,
  gstin text,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kids_institutions_profiles (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  headline text,
  institution_type text NOT NULL DEFAULT 'academy',
  registration_number text,
  campus_sqft integer,
  cctv_monitored boolean NOT NULL DEFAULT true,
  student_teacher_ratio text,
  certified_staff_count integer NOT NULL DEFAULT 3,
  certificates text[] NOT NULL DEFAULT '{}',
  gallery_images text[] NOT NULL DEFAULT '{}',
  preview_video_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers on profile tables
DROP TRIGGER IF EXISTS kids_academics_profiles_assert_type ON kids_academics_profiles;
CREATE TRIGGER kids_academics_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_academics_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_academics');

DROP TRIGGER IF EXISTS kids_stem_profiles_assert_type ON kids_stem_profiles;
CREATE TRIGGER kids_stem_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_stem_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_stem');

DROP TRIGGER IF EXISTS kids_performing_arts_profiles_assert_type ON kids_performing_arts_profiles;
CREATE TRIGGER kids_performing_arts_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_performing_arts_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_performing_arts');

DROP TRIGGER IF EXISTS kids_arts_crafts_profiles_assert_type ON kids_arts_crafts_profiles;
CREATE TRIGGER kids_arts_crafts_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_arts_crafts_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_arts_crafts');

DROP TRIGGER IF EXISTS kids_school_projects_profiles_assert_type ON kids_school_projects_profiles;
CREATE TRIGGER kids_school_projects_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_school_projects_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_school_projects');

DROP TRIGGER IF EXISTS kids_camps_profiles_assert_type ON kids_camps_profiles;
CREATE TRIGGER kids_camps_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_camps_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_camps');

DROP TRIGGER IF EXISTS kids_sports_fitness_profiles_assert_type ON kids_sports_fitness_profiles;
CREATE TRIGGER kids_sports_fitness_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_sports_fitness_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_sports_fitness');

DROP TRIGGER IF EXISTS kids_life_skills_profiles_assert_type ON kids_life_skills_profiles;
CREATE TRIGGER kids_life_skills_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_life_skills_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_life_skills');

DROP TRIGGER IF EXISTS kids_products_profiles_assert_type ON kids_products_profiles;
CREATE TRIGGER kids_products_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_products_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_products');

DROP TRIGGER IF EXISTS kids_institutions_profiles_assert_type ON kids_institutions_profiles;
CREATE TRIGGER kids_institutions_profiles_assert_type BEFORE INSERT OR UPDATE ON kids_institutions_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_institutions');

-- 3. Create the 10 Kids Item Tables
CREATE TABLE IF NOT EXISTS kids_academics_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  subject text,
  grade_level text,
  batch_or_1on1 text NOT NULL DEFAULT '1on1',
  syllabus_board text NOT NULL DEFAULT 'cbse',
  trial_available boolean NOT NULL DEFAULT true,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_academics_items_vendor_idx ON kids_academics_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_stem_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  topic text,
  hardware_included boolean NOT NULL DEFAULT true,
  software_required text,
  hands_on_ratio integer NOT NULL DEFAULT 70,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_stem_items_vendor_idx ON kids_stem_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_performing_arts_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  genre_style text,
  instrument_needed text,
  skill_level text NOT NULL DEFAULT 'all',
  recital_included boolean NOT NULL DEFAULT false,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_performing_arts_items_vendor_idx ON kids_performing_arts_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_arts_crafts_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  medium text,
  materials_list text,
  take_home_keepsake boolean NOT NULL DEFAULT true,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_arts_crafts_items_vendor_idx ON kids_arts_crafts_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_school_projects_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  target_standard text,
  subject_domain text,
  model_dimensions text,
  diy_guide_included boolean NOT NULL DEFAULT true,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_school_projects_items_vendor_idx ON kids_school_projects_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_camps_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  daily_schedule text,
  meals_included boolean NOT NULL DEFAULT false,
  field_trips_included boolean NOT NULL DEFAULT false,
  parent_showcase_date text,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_camps_items_vendor_idx ON kids_camps_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_sports_fitness_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  sport_type text,
  difficulty_level text NOT NULL DEFAULT 'all',
  gear_required text,
  physical_intensity text NOT NULL DEFAULT 'moderate',
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_sports_fitness_items_vendor_idx ON kids_sports_fitness_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_life_skills_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  skill_focus text,
  prerequisites text,
  take_home_project boolean NOT NULL DEFAULT true,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_life_skills_items_vendor_idx ON kids_life_skills_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_products_items (
  product_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  recommended_age text,
  safety_certified boolean NOT NULL DEFAULT true,
  box_contents text,
  diy_manual_included boolean NOT NULL DEFAULT true,
  rental_deposit_paise integer NOT NULL DEFAULT 0,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, vendor_id) REFERENCES products(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_products_items_vendor_idx ON kids_products_items (vendor_id);

CREATE TABLE IF NOT EXISTS kids_institutions_items (
  service_id text PRIMARY KEY,
  vendor_id text NOT NULL,
  age_bracket text,
  batch_timing text,
  facilities_included text[] NOT NULL DEFAULT '{}',
  parent_observation_allowed boolean NOT NULL DEFAULT true,
  poster_url text,
  video_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, vendor_id) REFERENCES services(id, vendor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS kids_institutions_items_vendor_idx ON kids_institutions_items (vendor_id);

-- Triggers on item tables
DROP TRIGGER IF EXISTS kids_academics_items_assert_type ON kids_academics_items;
CREATE TRIGGER kids_academics_items_assert_type BEFORE INSERT OR UPDATE ON kids_academics_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_academics');

DROP TRIGGER IF EXISTS kids_stem_items_assert_type ON kids_stem_items;
CREATE TRIGGER kids_stem_items_assert_type BEFORE INSERT OR UPDATE ON kids_stem_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_stem');

DROP TRIGGER IF EXISTS kids_performing_arts_items_assert_type ON kids_performing_arts_items;
CREATE TRIGGER kids_performing_arts_items_assert_type BEFORE INSERT OR UPDATE ON kids_performing_arts_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_performing_arts');

DROP TRIGGER IF EXISTS kids_arts_crafts_items_assert_type ON kids_arts_crafts_items;
CREATE TRIGGER kids_arts_crafts_items_assert_type BEFORE INSERT OR UPDATE ON kids_arts_crafts_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_arts_crafts');

DROP TRIGGER IF EXISTS kids_school_projects_items_assert_type ON kids_school_projects_items;
CREATE TRIGGER kids_school_projects_items_assert_type BEFORE INSERT OR UPDATE ON kids_school_projects_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_school_projects');

DROP TRIGGER IF EXISTS kids_camps_items_assert_type ON kids_camps_items;
CREATE TRIGGER kids_camps_items_assert_type BEFORE INSERT OR UPDATE ON kids_camps_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_camps');

DROP TRIGGER IF EXISTS kids_sports_fitness_items_assert_type ON kids_sports_fitness_items;
CREATE TRIGGER kids_sports_fitness_items_assert_type BEFORE INSERT OR UPDATE ON kids_sports_fitness_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_sports_fitness');

DROP TRIGGER IF EXISTS kids_life_skills_items_assert_type ON kids_life_skills_items;
CREATE TRIGGER kids_life_skills_items_assert_type BEFORE INSERT OR UPDATE ON kids_life_skills_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_life_skills');

DROP TRIGGER IF EXISTS kids_products_items_assert_type ON kids_products_items;
CREATE TRIGGER kids_products_items_assert_type BEFORE INSERT OR UPDATE ON kids_products_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_products');

DROP TRIGGER IF EXISTS kids_institutions_items_assert_type ON kids_institutions_items;
CREATE TRIGGER kids_institutions_items_assert_type BEFORE INSERT OR UPDATE ON kids_institutions_items FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_institutions');

-- 4. Kids categories (one per kids vendor type). Admin edits are kept.
INSERT INTO categories (id, label, short_label, emoji, blurb, tint, cover_from, cover_to, sort, is_active, fulfilment, vendor_type) VALUES
  ('kids_academics', 'Home Tutors & Academics', 'Tutors', '📚', 'Home tutors for Nursery–Class 5, phonics, maths, homework assistance', '#EDE3FF', '#EDE3FF', '#FFFFFF', 20, true, 'booking', 'kids_academics'),
  ('kids_stem', 'Science, STEM & Coding', 'STEM', '🤖', 'Robotics, Scratch & Python coding, DIY experiments, electronics', '#D9F4FF', '#D9F4FF', '#FFFFFF', 21, true, 'booking', 'kids_stem'),
  ('kids_performing_arts', 'Dance, Music & Performing Arts', 'Dance & Music', '💃', 'Bollywood, classical, folk dance, singing & musical instruments', '#FFE1EF', '#FFE1EF', '#FFFFFF', 22, true, 'booking', 'kids_performing_arts'),
  ('kids_arts_crafts', 'Art, Craft & Creative', 'Art & Craft', '🎨', 'Drawing, painting, clay modelling, pottery, origami, calligraphy', '#FFF3C4', '#FFF3C4', '#FFFFFF', 23, true, 'booking', 'kids_arts_crafts'),
  ('kids_school_projects', 'School Projects & Models', 'Projects', '📐', 'Science working models, scrapbooks, dioramas, competition prep', '#FFE6D5', '#FFE6D5', '#FFFFFF', 24, true, 'booking', 'kids_school_projects'),
  ('kids_camps', 'Holiday Camps & Clubs', 'Camps', '🏕️', 'Summer & winter bootcamps, workshops, multi-activity clubs', '#DDF8EA', '#DDF8EA', '#FFFFFF', 25, true, 'booking', 'kids_camps'),
  ('kids_sports_fitness', 'Kids Yoga, Chess & Sports', 'Chess & Sports', '♟️', 'FIDE chess coaching, yoga, gymnastics, skating, puzzle-solving', '#E3ECFF', '#E3ECFF', '#FFFFFF', 26, true, 'booking', 'kids_sports_fitness'),
  ('kids_life_skills', 'Life Skills & Hobbies', 'Life Skills', '🍳', 'No-fire cooking, dining etiquette, magic tricks, gardening', '#FFF8EC', '#FFF8EC', '#FFFFFF', 27, true, 'booking', 'kids_life_skills'),
  ('kids_products', 'Kids Kits & Materials', 'DIY Kits', '🧩', 'Science experiment boxes, art supplies, robotics kits, educational toys', '#FEF08A', '#FEF08A', '#FFFFFF', 28, true, 'delivery', 'kids_products'),
  ('kids_institutions', 'Preschools & Learning Centres', 'Institutions', '🏫', 'Preschools, daycares, activity academies, indoor play centres', '#F4F4F5', '#F4F4F5', '#FFFFFF', 29, true, 'booking', 'kids_institutions')
ON CONFLICT (id) DO UPDATE SET vendor_type = EXCLUDED.vendor_type, fulfilment = EXCLUDED.fulfilment;
