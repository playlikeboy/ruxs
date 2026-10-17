-- Vendors: main category (what they were onboarded as) and a Google Maps link.
ALTER TABLE "vendors" ADD COLUMN "category_id" text REFERENCES "categories"("id") ON UPDATE cascade ON DELETE set null;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "maps_url" text;--> statement-breakpoint
UPDATE "vendors" v SET "category_id" = s."category_id"
FROM (SELECT DISTINCT ON ("vendor_id") "vendor_id", "category_id" FROM "services" WHERE "archived_at" IS NULL ORDER BY "vendor_id", "created_at") s
WHERE s."vendor_id" = v."id" AND v."business_type" = 'booking';--> statement-breakpoint
UPDATE "vendors" v SET "category_id" = p."kind"
FROM (SELECT DISTINCT ON ("vendor_id") "vendor_id", "kind" FROM "products" WHERE "archived_at" IS NULL ORDER BY "vendor_id", "created_at") p
WHERE p."vendor_id" = v."id" AND v."business_type" = 'delivery';--> statement-breakpoint

-- Any signed-in household can rate any store; the reviewer may not be a customer yet.
ALTER TABLE "vendor_reviews" ADD COLUMN "author_name" text;--> statement-breakpoint
UPDATE "vendor_reviews" r SET "author_name" = c."name" FROM "customers" c WHERE c."id" = r."customer_id";--> statement-breakpoint
UPDATE "vendor_reviews" SET "author_name" = 'RUXs user' WHERE "author_name" IS NULL;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ALTER COLUMN "author_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint

-- Remove columns nothing uses any more.
ALTER TABLE "vendors" DROP COLUMN "service_modes";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "poll_at";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "opted_in_at";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "sent_at";
