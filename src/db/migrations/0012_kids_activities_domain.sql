-- 0012_kids_activities_domain.sql: Dedicated domain tables for Kids Activities & Learning Marketplace

CREATE TABLE IF NOT EXISTS "kids_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"emoji" text DEFAULT '🎈' NOT NULL,
	"cover_url" text,
	"tint" text DEFAULT '#FEF08A' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_categories_sort_idx" ON "kids_categories" ("sort");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_services" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"category_id" text NOT NULL REFERENCES "kids_categories"("id") ON DELETE restrict ON UPDATE cascade,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"min_age" integer DEFAULT 3 NOT NULL,
	"max_age" integer DEFAULT 11 NOT NULL,
	"suitable_classes" text[] DEFAULT '{}'::text[] NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"delivery_modes" text[] DEFAULT '{studio,home}'::text[] NOT NULL,
	"price_paise" integer NOT NULL,
	"material_fee_policy" text DEFAULT 'included' NOT NULL,
	"material_fee_paise" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_services_age_check" CHECK ("min_age" >= 3 AND "max_age" <= 18 AND "min_age" <= "max_age"),
	CONSTRAINT "kids_services_duration_check" CHECK ("duration_minutes" BETWEEN 15 AND 480),
	CONSTRAINT "kids_services_price_check" CHECK ("price_paise" >= 0),
	CONSTRAINT "kids_services_material_policy_check" CHECK ("material_fee_policy" IN ('included', 'extra', 'required'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_services_vendor_idx" ON "kids_services" ("vendor_id");
CREATE INDEX IF NOT EXISTS "kids_services_category_idx" ON "kids_services" ("category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "kids_services_vendor_slug_idx" ON "kids_services" ("vendor_id", "slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_children" (
	"id" text PRIMARY KEY NOT NULL,
	"guardian_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"birth_date" text,
	"birth_year" integer,
	"school_class" text,
	"activity_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_children_guardian_idx" ON "kids_children" ("guardian_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_service_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL UNIQUE,
	"client_key" text NOT NULL UNIQUE,
	"service_id" text REFERENCES "kids_services"("id") ON DELETE set null,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"guardian_user_id" text NOT NULL,
	"child_id" text NOT NULL REFERENCES "kids_children"("id") ON DELETE restrict,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"delivery_mode" text NOT NULL,
	"address" text,
	"price_snapshot_paise" integer NOT NULL,
	"material_fee_snapshot_paise" integer DEFAULT 0 NOT NULL,
	"payment_ref" text,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"booking_status" text DEFAULT 'confirmed' NOT NULL,
	"held_until" timestamp with time zone,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_bookings_mode_check" CHECK ("delivery_mode" IN ('home', 'studio', 'online')),
	CONSTRAINT "kids_bookings_status_check" CHECK ("booking_status" IN ('held', 'confirmed', 'completed', 'cancelled')),
	CONSTRAINT "kids_bookings_payment_status_check" CHECK ("payment_status" IN ('unpaid', 'paid', 'refund_due', 'refunded', 'pass_redeemed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_bookings_vendor_time_idx" ON "kids_service_bookings" ("vendor_id", "starts_at");
CREATE INDEX IF NOT EXISTS "kids_bookings_guardian_idx" ON "kids_service_bookings" ("guardian_user_id", "starts_at");
CREATE INDEX IF NOT EXISTS "kids_bookings_child_idx" ON "kids_service_bookings" ("child_id");
CREATE UNIQUE INDEX IF NOT EXISTS "kids_bookings_vendor_start_active_idx" ON "kids_service_bookings" ("vendor_id", "starts_at") WHERE "booking_status" IN ('held', 'confirmed');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_workshops" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"category_id" text NOT NULL REFERENCES "kids_categories"("id") ON DELETE restrict ON UPDATE cascade,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"eligible_ages" text DEFAULT 'Ages 5–11' NOT NULL,
	"min_age" integer DEFAULT 5 NOT NULL,
	"max_age" integer DEFAULT 11 NOT NULL,
	"eligible_classes" text[] DEFAULT '{}'::text[] NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"enrollment_deadline" timestamp with time zone NOT NULL,
	"venue_or_mode" text DEFAULT 'studio' NOT NULL,
	"address" text,
	"capacity" integer DEFAULT 10 NOT NULL,
	"price_paise" integer NOT NULL,
	"materials_description" text,
	"publication_state" text DEFAULT 'published' NOT NULL,
	"cancellation_policy" text DEFAULT 'Free cancellation up to 48 hours before camp start.' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_workshops_capacity_check" CHECK ("capacity" > 0),
	CONSTRAINT "kids_workshops_price_check" CHECK ("price_paise" >= 0),
	CONSTRAINT "kids_workshops_state_check" CHECK ("publication_state" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_workshops_vendor_idx" ON "kids_workshops" ("vendor_id");
CREATE INDEX IF NOT EXISTS "kids_workshops_category_idx" ON "kids_workshops" ("category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "kids_workshops_vendor_slug_idx" ON "kids_workshops" ("vendor_id", "slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_workshop_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL REFERENCES "kids_workshops"("id") ON DELETE cascade,
	"session_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"venue_or_mode" text,
	"session_order" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_workshop_sessions_workshop_idx" ON "kids_workshop_sessions" ("workshop_id", "session_date");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_workshop_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL REFERENCES "kids_workshops"("id") ON DELETE restrict,
	"child_id" text NOT NULL REFERENCES "kids_children"("id") ON DELETE restrict,
	"guardian_user_id" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"price_snapshot_paise" integer NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"payment_ref" text,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_enrollments_status_check" CHECK ("status" IN ('pending', 'confirmed', 'cancelled', 'waitlisted')),
	CONSTRAINT "kids_enrollments_payment_check" CHECK ("payment_status" IN ('unpaid', 'paid', 'refund_due', 'refunded', 'pass_redeemed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_enrollments_workshop_idx" ON "kids_workshop_enrollments" ("workshop_id");
CREATE INDEX IF NOT EXISTS "kids_enrollments_guardian_idx" ON "kids_workshop_enrollments" ("guardian_user_id");
CREATE INDEX IF NOT EXISTS "kids_enrollments_child_idx" ON "kids_workshop_enrollments" ("child_id");
CREATE UNIQUE INDEX IF NOT EXISTS "kids_enrollment_unique_active_idx" ON "kids_workshop_enrollments" ("workshop_id", "child_id") WHERE "status" IN ('pending', 'confirmed');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_provider_profiles" (
	"vendor_id" text PRIMARY KEY NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"headline" text,
	"qualifications" text,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"specialties" text[] DEFAULT '{}'::text[] NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"age_groups_served" text[] DEFAULT '{}'::text[] NOT NULL,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"safety_review_status" text DEFAULT 'pending' NOT NULL,
	"verified_by_admin_id" text,
	"verified_at" timestamp with time zone,
	"safety_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_provider_verification_check" CHECK ("verification_status" IN ('pending', 'approved', 'rejected', 'suspended')),
	CONSTRAINT "kids_provider_safety_check" CHECK ("safety_review_status" IN ('pending', 'passed', 'flagged'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_material_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text REFERENCES "kids_services"("id") ON DELETE cascade,
	"workshop_id" text REFERENCES "kids_workshops"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"description" text,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"policy" text DEFAULT 'optional' NOT NULL,
	"stock" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_materials_price_check" CHECK ("price_paise" >= 0),
	CONSTRAINT "kids_materials_policy_check" CHECK ("policy" IN ('optional', 'included', 'required'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_holiday_passes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"eligible_scope" text DEFAULT 'all' NOT NULL,
	"credits_total" integer NOT NULL,
	"price_paise" integer NOT NULL,
	"validity_days" integer DEFAULT 30 NOT NULL,
	"terms" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_passes_credits_check" CHECK ("credits_total" > 0),
	CONSTRAINT "kids_passes_price_check" CHECK ("price_paise" > 0)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_pass_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"guardian_user_id" text NOT NULL,
	"pass_id" text NOT NULL REFERENCES "kids_holiday_passes"("id") ON DELETE restrict,
	"purchased_credits" integer NOT NULL,
	"remaining_credits" integer NOT NULL,
	"purchase_price_paise" integer NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"payment_ref" text,
	"payment_status" text DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_pass_remaining_check" CHECK ("remaining_credits" >= 0 AND "remaining_credits" <= "purchased_credits"),
	CONSTRAINT "kids_pass_payment_check" CHECK ("payment_status" IN ('unpaid', 'paid', 'refunded'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_pass_purchases_guardian_idx" ON "kids_pass_purchases" ("guardian_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_pass_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_id" text NOT NULL REFERENCES "kids_pass_purchases"("id") ON DELETE cascade,
	"booking_id" text REFERENCES "kids_service_bookings"("id") ON DELETE set null,
	"enrollment_id" text REFERENCES "kids_workshop_enrollments"("id") ON DELETE set null,
	"credits_consumed" integer DEFAULT 1 NOT NULL,
	"idempotency_key" text NOT NULL UNIQUE,
	"status" text DEFAULT 'redeemed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_redemptions_status_check" CHECK ("status" IN ('redeemed', 'reversed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_redemptions_purchase_idx" ON "kids_pass_redemptions" ("purchase_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_safety_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"guardian_user_id" text NOT NULL,
	"child_id" text NOT NULL REFERENCES "kids_children"("id") ON DELETE cascade,
	"policy_version" text DEFAULT '2026-v1' NOT NULL,
	"consent_type" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip_address" text,
	CONSTRAINT "kids_consent_type_check" CHECK ("consent_type" IN ('home_supervision', 'photo_waiver', 'emergency_medical', 'activity_participation'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_consents_guardian_child_idx" ON "kids_safety_consents" ("guardian_user_id", "child_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "kids_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"guardian_user_id" text NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"booking_id" text REFERENCES "kids_service_bookings"("id") ON DELETE set null,
	"enrollment_id" text REFERENCES "kids_workshop_enrollments"("id") ON DELETE set null,
	"rating" integer NOT NULL,
	"review_text" text,
	"moderation_status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
	CONSTRAINT "kids_reviews_moderation_check" CHECK ("moderation_status" IN ('pending', 'published', 'hidden', 'flagged'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kids_reviews_vendor_idx" ON "kids_reviews" ("vendor_id");
--> statement-breakpoint

-- Seed Default Categories
INSERT INTO "kids_categories" ("id", "name", "description", "emoji", "tint", "sort", "is_active") VALUES
('academics', 'Academic & Homework Support', '1:1 home tutors and homework doubt-clearing for Nursery–Class 5', '📚', '#FEF08A', 1, true),
('stem', 'Science, STEM & School Projects', 'Hands-on robotics, science models, school exhibitions and scratch coding', '🔬', '#BAE6FD', 2, true),
('performing-arts', 'Dance, Music & Performing Arts', 'Kids keyboard, vocal music, Bollywood/classical dance and theatre', '🎭', '#FED7AA', 3, true),
('art-craft', 'Art, Craft & Creative Competitions', 'Pottery wheel, canvas painting, clay sculpting and competition art', '🎨', '#FBCFE8', 4, true),
('life-skills', 'Life Skills & Hobbies', 'Chess tactics, public speaking, Rubik''s cube, Vedic math and personality', '🧩', '#DDD6FE', 5, true),
('holiday', 'Holiday Activities & Enrichment', 'Weekend camps, holiday bootcamps, multi-day creative workshops', '🏕️', '#A7F3D0', 6, true)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "emoji" = EXCLUDED."emoji",
  "tint" = EXCLUDED."tint",
  "sort" = EXCLUDED."sort",
  "is_active" = EXCLUDED."is_active";
