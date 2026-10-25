-- 0023: hero slides on the household home screen, managed in /admin/banners.
-- Also lets kids_products (Kids Kits & Materials, a delivery store) write its menu:
-- 0013's products trigger predates that type and rejected every item it saved.
CREATE TABLE IF NOT EXISTS "home_banners" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "subtitle" text,
  "image_url" text,
  "href" text DEFAULT '/app' NOT NULL,
  "cta_label" text,
  "tone" text DEFAULT 'peach' NOT NULL,
  "sort" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "home_banners_tone_check" CHECK ("tone" in ('peach', 'mint', 'butter', 'blush'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "home_banners_sort_idx" ON "home_banners" USING btree ("sort");
--> statement-breakpoint
INSERT INTO "home_banners" ("id", "title", "subtitle", "image_url", "href", "cta_label", "tone", "sort") VALUES
  ('sample-tiffin', 'Hot lunch, every day', 'Subscribe to a home kitchen and skip any day before the cutoff.', '/banners/tiffin.jpg', '/app/category/tiffin', 'Find a tiffin', 'peach', 0),
  ('sample-kids', 'Classes your kids will love', 'Dance, coding, art and tuition from verified teachers nearby.', '/banners/kids-act.jpg', '/app/kids/activities', 'Explore classes', 'mint', 1),
  ('sample-delivery', 'Water and milk at your door', '20L cans and fresh milk on a schedule. Pay once a month.', '/banners/delivery.jpg', '/app/category/water', 'Order now', 'butter', 2)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
DROP TRIGGER IF EXISTS products_vendor_type ON products;
--> statement-breakpoint
CREATE TRIGGER products_vendor_type BEFORE INSERT OR UPDATE OF vendor_id ON products FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('tiffin', 'water', 'milk', 'gifts', 'store', 'kids_products');
