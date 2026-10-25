-- 0021: Allow all kids vendor types to write to kids_services, kids_workshops, and kids_provider_profiles.
-- Previously, ruxs_assert_vendor_type only had 'kids' passed to it, rejecting the 10 differentiated
-- kids vendor types (kids_performing_arts, kids_academics, kids_stem, etc.).

-- 1. Update ruxs_assert_vendor_type to recognise 'kids' as matching any 'kids' or 'kids_%' vendor type.
CREATE OR REPLACE FUNCTION ruxs_assert_vendor_type() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t text;
BEGIN
  SELECT vendor_type INTO t FROM vendors WHERE id = NEW.vendor_id;
  IF t IS NULL OR NOT (
    t = ANY (TG_ARGV)
    OR ('kids' = ANY (TG_ARGV) AND (t = 'kids' OR t LIKE 'kids_%'))
  ) THEN
    RAISE EXCEPTION 'A % vendor cannot write to %', coalesce(t, 'unknown'), TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

--> statement-breakpoint

-- 2. Explicitly recreate triggers on kids_services, kids_workshops, and kids_provider_profiles with all kids types.
DROP TRIGGER IF EXISTS kids_services_vendor_type ON kids_services;
CREATE TRIGGER kids_services_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_services FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type(
  'kids', 'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
  'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills',
  'kids_products', 'kids_institutions'
);

--> statement-breakpoint

DROP TRIGGER IF EXISTS kids_workshops_vendor_type ON kids_workshops;
CREATE TRIGGER kids_workshops_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_workshops FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type(
  'kids', 'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
  'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills',
  'kids_products', 'kids_institutions'
);

--> statement-breakpoint

DROP TRIGGER IF EXISTS kids_provider_profiles_type ON kids_provider_profiles;
CREATE TRIGGER kids_provider_profiles_type BEFORE INSERT OR UPDATE OF vendor_id ON kids_provider_profiles FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type(
  'kids', 'kids_academics', 'kids_stem', 'kids_performing_arts', 'kids_arts_crafts',
  'kids_school_projects', 'kids_camps', 'kids_sports_fitness', 'kids_life_skills',
  'kids_products', 'kids_institutions'
);
