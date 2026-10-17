-- Booking providers (gym trainers, physiotherapists…) get their own schema,
-- separate from delivery stores (tiffin, water, milk): services instead of
-- products, standalone bookings instead of shop orders, and a provider profile.

ALTER TABLE "vendors" ADD COLUMN "business_type" text DEFAULT 'delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_business_type_check" CHECK ("business_type" in ('delivery', 'booking'));--> statement-breakpoint
UPDATE "vendors" SET "business_type" = 'booking' WHERE "id" IN (
	SELECT DISTINCT p."vendor_id" FROM "products" p JOIN "categories" c ON c."id" = p."kind" WHERE c."fulfilment" = 'booking'
);--> statement-breakpoint

CREATE TABLE "provider_profiles" (
	"vendor_id" text PRIMARY KEY NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"headline" text,
	"qualifications" text,
	"experience_years" integer,
	"specialities" text[] DEFAULT '{}' NOT NULL,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"gender" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_profiles_experience_check" CHECK ("experience_years" IS NULL OR "experience_years" BETWEEN 0 AND 60),
	CONSTRAINT "provider_profiles_gender_check" CHECK ("gender" IS NULL OR "gender" in ('female', 'male', 'other'))
);--> statement-breakpoint
INSERT INTO "provider_profiles" ("vendor_id") SELECT "id" FROM "vendors" WHERE "business_type" = 'booking';--> statement-breakpoint

CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"category_id" text NOT NULL REFERENCES "categories"("id") ON UPDATE cascade ON DELETE restrict,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"duration_minutes" integer NOT NULL,
	"price_paise" integer NOT NULL,
	"modes" text[] DEFAULT '{home}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_duration_check" CHECK ("duration_minutes" BETWEEN 15 AND 480),
	CONSTRAINT "services_price_check" CHECK ("price_paise" >= 0),
	CONSTRAINT "services_modes_check" CHECK ("modes" <@ ARRAY['home', 'studio', 'online']::text[] AND cardinality("modes") > 0)
);--> statement-breakpoint
CREATE INDEX "services_vendor_idx" ON "services" USING btree ("vendor_id");--> statement-breakpoint
INSERT INTO "services" ("id", "vendor_id", "category_id", "name", "description", "image_url", "duration_minutes", "price_paise", "modes", "is_active", "created_at")
SELECT p."id", p."vendor_id", p."kind", p."name", p."description", p."image_url", COALESCE(p."duration_minutes", 60), p."price_paise",
	v."service_modes", (p."is_available" AND p."archived_at" IS NULL), p."created_at"
FROM "products" p JOIN "categories" c ON c."id" = p."kind" JOIN "vendors" v ON v."id" = p."vendor_id"
WHERE c."fulfilment" = 'booking';--> statement-breakpoint

ALTER TABLE "bookings" ADD COLUMN "service_id" text REFERENCES "services"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "number" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "client_key" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "price_paise" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_mode" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_status" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "legacy_order_id" text;--> statement-breakpoint
UPDATE "bookings" b SET
	"service_id" = b."product_id",
	"number" = 'BK-' || substr(so."number", 4),
	"client_key" = so."client_key",
	"price_paise" = so."total_paise",
	"payment_mode" = CASE so."payment_mode" WHEN 'online' THEN 'online' ELSE 'pay_at_session' END,
	"payment_status" = so."payment_status",
	"notes" = so."notes",
	"legacy_order_id" = so."id"
FROM "shop_orders" so WHERE so."id" = b."shop_order_id";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "client_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "price_paise" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "payment_mode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "payment_status" SET DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "payment_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_number_unique" UNIQUE ("number");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_key_unique" UNIQUE ("client_key");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_price_check" CHECK ("price_paise" >= 0);--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payment_mode_check" CHECK ("payment_mode" in ('online', 'pay_at_session'));--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payment_status_check" CHECK ("payment_status" in ('unpaid', 'paid', 'refund_due', 'refunded'));--> statement-breakpoint

ALTER TABLE "payments" ADD COLUMN "booking_id" text REFERENCES "bookings"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_purpose_check";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purpose_check" CHECK ("purpose" in ('shop_order', 'dues', 'booking'));--> statement-breakpoint
UPDATE "payments" p SET "booking_id" = b."id", "purpose" = 'booking', "shop_order_id" = NULL
FROM "bookings" b WHERE p."shop_order_id" = b."legacy_order_id";--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint

-- Detach bookings from orders, then remove the orders that only existed for bookings.
ALTER TABLE "bookings" DROP COLUMN "shop_order_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "product_id";--> statement-breakpoint
DELETE FROM "shop_orders" WHERE "id" IN (SELECT "legacy_order_id" FROM "bookings" WHERE "legacy_order_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "legacy_order_id";--> statement-breakpoint

-- Booking items now live in services; products are only for delivery stores.
DELETE FROM "products" WHERE "kind" IN (SELECT "id" FROM "categories" WHERE "fulfilment" = 'booking');--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "duration_minutes";
