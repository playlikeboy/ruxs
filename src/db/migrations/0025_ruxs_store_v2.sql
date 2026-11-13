-- 0025: RUXs Store v2. Additive only and safe to re-run: new tables use
-- IF NOT EXISTS, new columns use ADD COLUMN IF NOT EXISTS, and nothing outside
-- the store_* tables is touched.
--   * Pan-India selling: serviceability defaults to 'india'; orders snapshot a
--     full ship-to address (PIN, city, state).
--   * store_shipping_zones: fee, estimate and COD by PIN prefix or state.
--   * store_fulfilment_partners + partner columns on store_orders (INTERNAL:
--     never shown to households).
--   * Coupons (+ insert-only redemptions), reviews, wishlist, back-in-stock
--     alerts, return requests, collections and an insert-only audit log.
ALTER TABLE "store_settings" ALTER COLUMN "serviceability" SET DEFAULT 'india';
--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "default_eta_min_days" integer DEFAULT 3 NOT NULL;
--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "default_eta_max_days" integer DEFAULT 7 NOT NULL;
--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "return_window_days" integer DEFAULT 7 NOT NULL;
--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "auto_forward" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "store_settings" DROP CONSTRAINT IF EXISTS "store_settings_eta_check";
--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_eta_check" CHECK ("default_eta_min_days" >= 0 and "default_eta_max_days" >= "default_eta_min_days" and "return_window_days" >= 0);
--> statement-breakpoint
-- The row seeded by 0024 becomes pan-India. A row an admin has already saved
-- (updated_by set) keeps whatever they chose, so re-running changes nothing.
UPDATE "store_settings" SET "serviceability" = 'india' WHERE "id" = 1 AND "serviceability" = 'geofence' AND "updated_by" IS NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_shipping_zones" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "pin_prefixes" text[] DEFAULT '{}'::text[] NOT NULL,
  "states" text[] DEFAULT '{}'::text[] NOT NULL,
  "fee_paise" integer DEFAULT 0 NOT NULL,
  "free_above_paise" integer,
  "eta_min_days" integer DEFAULT 3 NOT NULL,
  "eta_max_days" integer DEFAULT 7 NOT NULL,
  "cod_allowed" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_shipping_zones_fee_check" CHECK ("fee_paise" >= 0 and ("free_above_paise" is null or "free_above_paise" >= 0)),
  CONSTRAINT "store_shipping_zones_eta_check" CHECK ("eta_min_days" >= 0 and "eta_max_days" >= "eta_min_days")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_fulfilment_partners" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "contact_name" text DEFAULT '' NOT NULL,
  "email" text NOT NULL,
  "phone" text DEFAULT '' NOT NULL,
  "coverage_states" text[] DEFAULT '{}'::text[] NOT NULL,
  "coverage_pin_prefixes" text[] DEFAULT '{}'::text[] NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_coupons" (
  "id" text PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "kind" text NOT NULL,
  "value" integer NOT NULL,
  "min_order_paise" integer DEFAULT 0 NOT NULL,
  "max_discount_paise" integer,
  "usage_limit" integer,
  "per_user_limit" integer,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_coupons_kind_check" CHECK ("kind" in ('percent', 'flat')),
  CONSTRAINT "store_coupons_value_check" CHECK ("value" > 0 and ("kind" <> 'percent' or "value" <= 10000)),
  CONSTRAINT "store_coupons_limits_check" CHECK ("min_order_paise" >= 0 and ("max_discount_paise" is null or "max_discount_paise" > 0) and ("usage_limit" is null or "usage_limit" > 0) and ("per_user_limit" is null or "per_user_limit" > 0))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_coupons_code_idx" ON "store_coupons" USING btree (upper("code"));
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "discount_paise" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "coupon_id" text CONSTRAINT "store_orders_coupon_id_store_coupons_id_fk" REFERENCES "store_coupons"("id");
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "coupon_code" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "customer_email" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "ship_line1" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "ship_line2" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "ship_landmark" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "ship_city" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "ship_state" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "ship_pincode" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "zone_id" text CONSTRAINT "store_orders_zone_id_store_shipping_zones_id_fk" REFERENCES "store_shipping_zones"("id");
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "zone_name" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "eta_min_days" integer;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "eta_max_days" integer;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "partner_id" text CONSTRAINT "store_orders_partner_id_store_fulfilment_partners_id_fk" REFERENCES "store_fulfilment_partners"("id");
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "forwarded_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "forward_emailed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "partner_ref" text;
--> statement-breakpoint
ALTER TABLE "store_orders" ADD COLUMN IF NOT EXISTS "partner_status_note" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_orders_partner_idx" ON "store_orders" USING btree ("partner_id");
--> statement-breakpoint
-- The order total now includes the coupon discount.
ALTER TABLE "store_orders" DROP CONSTRAINT IF EXISTS "store_orders_money_check";
--> statement-breakpoint
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_money_check" CHECK ("subtotal_paise" >= 0 and "delivery_fee_paise" >= 0 and "discount_paise" >= 0 and "discount_paise" <= "subtotal_paise" and "total_paise" = "subtotal_paise" + "delivery_fee_paise" - "discount_paise");
--> statement-breakpoint
ALTER TABLE "store_orders" DROP CONSTRAINT IF EXISTS "store_orders_pincode_check";
--> statement-breakpoint
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_pincode_check" CHECK ("ship_pincode" is null or "ship_pincode" ~ '^[1-9][0-9]{5}$');
--> statement-breakpoint
-- Returned units go back on the shelf as a 'return' movement.
ALTER TABLE "store_stock_movements" DROP CONSTRAINT IF EXISTS "store_stock_movements_reason_check";
--> statement-breakpoint
ALTER TABLE "store_stock_movements" ADD CONSTRAINT "store_stock_movements_reason_check" CHECK ("reason" in ('restock', 'order', 'cancel', 'adjust', 'return'));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_coupon_redemptions" (
  "id" text PRIMARY KEY NOT NULL,
  "coupon_id" text NOT NULL,
  "order_id" text NOT NULL,
  "user_id" text NOT NULL,
  "discount_paise" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_coupon_redemptions_coupon_id_store_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "store_coupons"("id") ON DELETE restrict,
  CONSTRAINT "store_coupon_redemptions_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE restrict,
  CONSTRAINT "store_coupon_redemptions_discount_check" CHECK ("discount_paise" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_coupon_redemptions_order_idx" ON "store_coupon_redemptions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_coupon_redemptions_coupon_idx" ON "store_coupon_redemptions" USING btree ("coupon_id", "user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_product_reviews" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL,
  "user_id" text NOT NULL,
  "order_id" text NOT NULL,
  "rating" integer NOT NULL,
  "title" text DEFAULT '' NOT NULL,
  "body" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_product_reviews_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE restrict,
  CONSTRAINT "store_product_reviews_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE restrict,
  CONSTRAINT "store_product_reviews_rating_check" CHECK ("rating" between 1 and 5),
  CONSTRAINT "store_product_reviews_status_check" CHECK ("status" in ('pending', 'published', 'hidden'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_product_reviews_product_user_idx" ON "store_product_reviews" USING btree ("product_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_product_reviews_status_idx" ON "store_product_reviews" USING btree ("status", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_wishlist" (
  "user_id" text NOT NULL,
  "product_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_wishlist_user_id_product_id_pk" PRIMARY KEY ("user_id", "product_id"),
  CONSTRAINT "store_wishlist_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_stock_alerts" (
  "user_id" text NOT NULL,
  "product_id" text NOT NULL,
  "email" text NOT NULL,
  "notified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_stock_alerts_user_id_product_id_pk" PRIMARY KEY ("user_id", "product_id"),
  CONSTRAINT "store_stock_alerts_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_stock_alerts_pending_idx" ON "store_stock_alerts" USING btree ("product_id") WHERE "notified_at" is null;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_return_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "user_id" text NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'requested' NOT NULL,
  "admin_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "approved_at" timestamp with time zone,
  "rejected_at" timestamp with time zone,
  "received_at" timestamp with time zone,
  "refunded_at" timestamp with time zone,
  CONSTRAINT "store_return_requests_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE restrict,
  CONSTRAINT "store_return_requests_status_check" CHECK ("status" in ('requested', 'approved', 'rejected', 'received', 'refunded'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_return_requests_order_idx" ON "store_return_requests" USING btree ("order_id") WHERE "status" <> 'rejected';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_return_requests_status_idx" ON "store_return_requests" USING btree ("status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_return_requests_user_idx" ON "store_return_requests" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_collections" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "subtitle" text DEFAULT '' NOT NULL,
  "image" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_collections_slug_unique" UNIQUE ("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_collection_products" (
  "collection_id" text NOT NULL,
  "product_id" text NOT NULL,
  "sort" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "store_collection_products_collection_id_product_id_pk" PRIMARY KEY ("collection_id", "product_id"),
  CONSTRAINT "store_collection_products_collection_id_store_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "store_collections"("id") ON DELETE cascade,
  CONSTRAINT "store_collection_products_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_collection_products_product_idx" ON "store_collection_products" USING btree ("product_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "actor_user_id" text NOT NULL,
  "action" text NOT NULL,
  "entity" text NOT NULL,
  "entity_id" text,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_audit_log_entity_idx" ON "store_audit_log" USING btree ("entity", "entity_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_audit_log_created_idx" ON "store_audit_log" USING btree ("created_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION block_store_insert_only_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is insert-only: add a new row instead', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trigger_block_store_coupon_redemptions_mutation ON store_coupon_redemptions;
--> statement-breakpoint
CREATE TRIGGER trigger_block_store_coupon_redemptions_mutation
BEFORE UPDATE OR DELETE ON store_coupon_redemptions
FOR EACH ROW EXECUTE FUNCTION block_store_insert_only_mutation();
--> statement-breakpoint
DROP TRIGGER IF EXISTS trigger_block_store_audit_log_mutation ON store_audit_log;
--> statement-breakpoint
CREATE TRIGGER trigger_block_store_audit_log_mutation
BEFORE UPDATE OR DELETE ON store_audit_log
FOR EACH ROW EXECUTE FUNCTION block_store_insert_only_mutation();
