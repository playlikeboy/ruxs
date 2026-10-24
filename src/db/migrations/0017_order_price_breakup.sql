ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "gst_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "prices_include_gst" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "discount_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_gst_bps_check" CHECK ("gst_bps" between 0 and 2800);--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_discount_bps_check" CHECK ("discount_bps" between 0 and 9000);--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN IF NOT EXISTS "discount_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN IF NOT EXISTS "gst_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN IF NOT EXISTS "gst_included" boolean DEFAULT true NOT NULL;
