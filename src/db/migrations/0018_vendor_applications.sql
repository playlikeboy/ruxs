CREATE TABLE IF NOT EXISTS "vendor_applications" (
  "id" text PRIMARY KEY NOT NULL,
  "business_name" text NOT NULL,
  "owner_name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text,
  "category_id" text NOT NULL,
  "area" text NOT NULL,
  "city" text NOT NULL,
  "details" text,
  "status" text DEFAULT 'new' NOT NULL,
  "admin_notes" text,
  "vendor_id" text REFERENCES "vendors"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "vendor_applications_status_check" CHECK ("status" in ('new', 'contacted', 'approved', 'rejected'))
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendor_applications_status_idx" ON "vendor_applications" ("status", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendor_applications_phone_idx" ON "vendor_applications" ("phone");
