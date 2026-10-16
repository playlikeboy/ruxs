CREATE TABLE "vendor_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"customer_id" text NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"reply" text,
	"replied_at" timestamp with time zone,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_reviews_vendor_user_idx" ON "vendor_reviews" USING btree ("vendor_id","user_id");--> statement-breakpoint
CREATE INDEX "vendor_reviews_vendor_visible_idx" ON "vendor_reviews" USING btree ("vendor_id","is_hidden");--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"discovery_radius_km" integer DEFAULT 10 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_singleton" CHECK ("id" = 1),
	CONSTRAINT "platform_settings_radius_check" CHECK ("discovery_radius_km" BETWEEN 1 AND 100)
);--> statement-breakpoint
INSERT INTO "platform_settings" ("id", "discovery_radius_km") VALUES (1, 10);
