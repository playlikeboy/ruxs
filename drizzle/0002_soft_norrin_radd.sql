ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "shift" varchar(30) DEFAULT 'MORNING' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "instructions" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "vendor_type" varchar(30) DEFAULT 'TIFFIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "type_config" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "credentials" text;