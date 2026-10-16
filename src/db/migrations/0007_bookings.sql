ALTER TABLE "categories" ADD COLUMN "fulfilment" text DEFAULT 'delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_fulfilment_check" CHECK ("fulfilment" in ('delivery', 'booking'));--> statement-breakpoint
INSERT INTO "categories" ("id", "label", "short_label", "emoji", "blurb", "tint", "cover_from", "cover_to", "sort", "fulfilment") VALUES
('fitness', 'Gym trainers', 'Trainers', '🏋️', 'Personal training at home or gym', '#E2EEFA', '#CFE3F7', '#FCE4EC', 5, 'booking'),
('physio', 'Physiotherapy', 'Physio', '🩺', 'Physiotherapists who visit you', '#E1F3E7', '#E1F3E7', '#E2EEFA', 6, 'booking')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
UPDATE "categories" SET "sort" = 9 WHERE "id" = 'other';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_duration_check" CHECK ("duration_minutes" IS NULL OR ("duration_minutes" BETWEEN 15 AND 480));--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "service_modes" text[] DEFAULT '{home}' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "booking_notice_minutes" integer DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "cancel_cutoff_hours" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"weekday" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_rules_weekday_check" CHECK ("weekday" in ('mon','tue','wed','thu','fri','sat','sun')),
	CONSTRAINT "availability_rules_time_check" CHECK ("start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "start_time" < "end_time")
);--> statement-breakpoint
CREATE INDEX "availability_rules_vendor_idx" ON "availability_rules" USING btree ("vendor_id","weekday");--> statement-breakpoint
CREATE TABLE "availability_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_blocks_range_check" CHECK ("starts_at" < "ends_at")
);--> statement-breakpoint
CREATE INDEX "availability_blocks_vendor_idx" ON "availability_blocks" USING btree ("vendor_id","starts_at");--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"customer_id" text NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
	"user_id" text NOT NULL,
	"product_id" text REFERENCES "products"("id") ON DELETE set null,
	"shop_order_id" text NOT NULL UNIQUE REFERENCES "shop_orders"("id") ON DELETE cascade,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"mode" text NOT NULL,
	"address" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"held_until" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_mode_check" CHECK ("mode" in ('home', 'studio', 'online')),
	CONSTRAINT "bookings_status_check" CHECK ("status" in ('held', 'confirmed', 'done', 'no_show', 'cancelled')),
	CONSTRAINT "bookings_range_check" CHECK ("starts_at" < "ends_at")
);--> statement-breakpoint
CREATE INDEX "bookings_vendor_time_idx" ON "bookings" USING btree ("vendor_id","starts_at");--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_vendor_start_active_idx" ON "bookings" USING btree ("vendor_id","starts_at") WHERE "status" in ('held', 'confirmed');
