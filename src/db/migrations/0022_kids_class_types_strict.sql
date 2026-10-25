-- 0022: 0021 widened ruxs_assert_vendor_type so a 'kids' trigger matched any kids_% type,
-- which also let kids_products (a delivery store) write class tables. Restore the strict
-- 0013 function, list the class types on each trigger instead, and give active
-- admin-onboarded kids class providers an approved safety review row.

CREATE OR REPLACE FUNCTION ruxs_assert_vendor_type() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t text;
BEGIN
  SELECT vendor_type INTO t FROM vendors WHERE id = NEW.vendor_id;
  IF t IS NULL OR NOT (t = ANY (TG_ARGV)) THEN
    RAISE EXCEPTION 'A % vendor cannot write to %', coalesce(t, 'unknown'), TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS kids_services_vendor_type ON kids_services;
--> statement-breakpoint
CREATE TRIGGER kids_services_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_services FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type(
  'kids', 'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
  'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills', 'kids_institutions'
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS kids_workshops_vendor_type ON kids_workshops;
--> statement-breakpoint
CREATE TRIGGER kids_workshops_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_workshops FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type(
  'kids', 'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
  'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills', 'kids_institutions'
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS kids_provider_profiles_type ON kids_provider_profiles;
--> statement-breakpoint
CREATE TRIGGER kids_provider_profiles_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_provider_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type(
  'kids', 'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
  'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills', 'kids_institutions'
);
--> statement-breakpoint
-- Admin-onboarded kids providers are vetted at onboarding; give active ones without a review row an approved one.
INSERT INTO kids_provider_profiles (vendor_id, verification_status, safety_review_status, verified_at)
SELECT id, 'approved', 'passed', now() FROM vendors
WHERE status = 'active' AND vendor_type IN (
  'kids', 'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
  'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills', 'kids_institutions'
)
ON CONFLICT (vendor_id) DO NOTHING;
