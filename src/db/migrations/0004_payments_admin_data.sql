CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"short_label" text NOT NULL,
	"emoji" text NOT NULL,
	"blurb" text NOT NULL DEFAULT '',
	"tint" text NOT NULL DEFAULT '#F4F4F5',
	"cover_from" text NOT NULL DEFAULT '#F4F4F5',
	"cover_to" text NOT NULL DEFAULT '#FFFFFF',
	"sort" integer NOT NULL DEFAULT 0,
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_id_check" CHECK ("id" ~ '^[a-z0-9-]+$')
);--> statement-breakpoint
INSERT INTO "categories" ("id", "label", "short_label", "emoji", "blurb", "tint", "cover_from", "cover_to", "sort") VALUES
('tiffin', 'Tiffin service', 'Tiffin', '🍱', 'Home-style meals, daily or one-off', '#FFE8DD', '#FFD9C7', '#FFF3C9', 1),
('water', 'Water delivery', 'Water', '💧', '20L cans to your door', '#E2EEFA', '#CFE3F7', '#E1F3E7', 2),
('milk', 'Milk & dairy', 'Milk', '🥛', 'Fresh milk, curd and paneer', '#FFF3C9', '#FFF3C9', '#E1F3E7', 3),
('other', 'Other essentials', 'More', '🧺', 'Everything else for the house', '#FCE4EC', '#FCE4EC', '#E2EEFA', 4);--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_kind_check";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_kind_fk" FOREIGN KEY ("kind") REFERENCES "categories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;--> statement-breakpoint
CREATE TABLE "localities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "localities" ("id", "name", "city", "state", "latitude", "longitude") VALUES
('blr-hsr', 'HSR Layout', 'Bengaluru', 'Karnataka', 12.9121, 77.6446),
('blr-kor', 'Koramangala', 'Bengaluru', 'Karnataka', 12.9352, 77.6245),
('blr-bel', 'Bellandur', 'Bengaluru', 'Karnataka', 12.9304, 77.6784),
('blr-ind', 'Indiranagar', 'Bengaluru', 'Karnataka', 12.9784, 77.6408),
('blr-whi', 'Whitefield', 'Bengaluru', 'Karnataka', 12.9698, 77.7500),
('blr-ecity', 'Electronic City', 'Bengaluru', 'Karnataka', 12.8399, 77.6770),
('blr-jay', 'Jayanagar', 'Bengaluru', 'Karnataka', 12.9308, 77.5838),
('blr-cen', 'Central Bengaluru', 'Bengaluru', 'Karnataka', 12.9716, 77.5946),
('mum-pow', 'Powai', 'Mumbai', 'Maharashtra', 19.1176, 72.9060),
('mum-and', 'Andheri West', 'Mumbai', 'Maharashtra', 19.1363, 72.8277),
('mum-ban', 'Bandra West', 'Mumbai', 'Maharashtra', 19.0596, 72.8295),
('mum-par', 'Lower Parel', 'Mumbai', 'Maharashtra', 18.9953, 72.8315),
('mum-tha', 'Thane West', 'Mumbai', 'Maharashtra', 19.2183, 72.9781),
('mum-nav', 'Vashi, Navi Mumbai', 'Mumbai', 'Maharashtra', 19.0771, 72.9986),
('mum-cen', 'Dadar / Central Mumbai', 'Mumbai', 'Maharashtra', 19.0178, 72.8478),
('del-cyb', 'DLF Cyber City, Gurugram', 'Delhi NCR', 'Haryana', 28.4950, 77.0895),
('del-noi', 'Sector 62, Noida', 'Delhi NCR', 'Uttar Pradesh', 28.6280, 77.3649),
('del-sou', 'South Extension / Saket', 'Delhi NCR', 'Delhi', 28.5244, 77.2066),
('del-dwa', 'Dwarka Sector 11', 'Delhi NCR', 'Delhi', 28.5823, 77.0500),
('del-roh', 'Rohini Sector 13', 'Delhi NCR', 'Delhi', 28.7180, 77.1215),
('del-cen', 'Connaught Place', 'Delhi NCR', 'Delhi', 28.6315, 77.2167),
('hyd-hit', 'Hitec City / Madhapur', 'Hyderabad', 'Telangana', 17.4474, 78.3762),
('hyd-gac', 'Gachibowli', 'Hyderabad', 'Telangana', 17.4401, 78.3489),
('hyd-ban', 'Banjara Hills', 'Hyderabad', 'Telangana', 17.4156, 78.4357),
('hyd-jub', 'Jubilee Hills', 'Hyderabad', 'Telangana', 17.4319, 78.4073),
('hyd-cen', 'Begumpet / Central', 'Hyderabad', 'Telangana', 17.4447, 78.4664),
('pun-hin', 'Hinjewadi Phase 1', 'Pune', 'Maharashtra', 18.5913, 73.7389),
('pun-vim', 'Viman Nagar', 'Pune', 'Maharashtra', 18.5679, 73.9143),
('pun-wak', 'Wakad / Pimple Saudagar', 'Pune', 'Maharashtra', 18.5987, 73.7661),
('pun-kot', 'Kothrud', 'Pune', 'Maharashtra', 18.5074, 73.8077),
('pun-cen', 'Shivajinagar / Central', 'Pune', 'Maharashtra', 18.5314, 73.8446),
('rnc-lal', 'Lalpur', 'Ranchi', 'Jharkhand', 23.3747, 85.3349),
('rnc-har', 'Harmu', 'Ranchi', 'Jharkhand', 23.3534, 85.2990),
('rnc-kan', 'Kanke Road', 'Ranchi', 'Jharkhand', 23.4060, 85.3210),
('rnc-dor', 'Doranda', 'Ranchi', 'Jharkhand', 23.3247, 85.3256),
('rnc-bar', 'Bariatu', 'Ranchi', 'Jharkhand', 23.3880, 85.3500),
('rnc-mor', 'Morabadi', 'Ranchi', 'Jharkhand', 23.3940, 85.3360),
('rnc-ash', 'Ashok Nagar', 'Ranchi', 'Jharkhand', 23.3480, 85.3080),
('rnc-cen', 'Main Road / Central Ranchi', 'Ranchi', 'Jharkhand', 23.3602, 85.3250),
('kol-sal', 'Salt Lake Sector V', 'Kolkata', 'West Bengal', 22.5867, 88.4172),
('kol-new', 'New Town', 'Kolkata', 'West Bengal', 22.5898, 88.4744),
('che-omr', 'OMR / Thoraipakkam', 'Chennai', 'Tamil Nadu', 12.9348, 80.2312),
('che-ann', 'Anna Nagar', 'Chennai', 'Tamil Nadu', 13.0850, 80.2101);--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text UNIQUE,
	"user_id" text UNIQUE,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_admins_identity_check" CHECK ("email" IS NOT NULL OR "user_id" IS NOT NULL),
	CONSTRAINT "platform_admins_email_lower" CHECK ("email" IS NULL OR "email" = lower("email"))
);--> statement-breakpoint
INSERT INTO "platform_admins" ("id", "email", "user_id") VALUES
(gen_random_uuid()::text, 'shaswatraj3@gmail.com', NULL),
(gen_random_uuid()::text, 'sh20raj@gmail.com', NULL),
(gen_random_uuid()::text, NULL, 'ce66ea1a-58fc-44e9-8231-8542f36e449a'),
(gen_random_uuid()::text, NULL, 'a9c9916b-1320-486a-a52b-4c18791444d1');--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "login_id" text UNIQUE;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "commission_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_commission_check" CHECK ("commission_bps" >= 0 AND "commission_bps" <= 5000);--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "payment_status" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_payment_status_check" CHECK ("payment_status" in ('unpaid', 'paid', 'refund_due', 'refunded'));--> statement-breakpoint
ALTER TABLE "shop_orders" DROP CONSTRAINT "shop_orders_payment_check";--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_payment_check" CHECK ("payment_mode" in ('cod', 'monthly_bill', 'online'));--> statement-breakpoint
ALTER TABLE "shop_orders" DROP CONSTRAINT "shop_orders_status_check";--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_status_check" CHECK ("status" in ('awaiting_payment', 'placed', 'accepted', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'));--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"customer_id" text NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"shop_order_id" text REFERENCES "shop_orders"("id") ON DELETE set null,
	"amount_paise" integer NOT NULL,
	"razorpay_order_id" text NOT NULL UNIQUE,
	"razorpay_payment_id" text UNIQUE,
	"status" text DEFAULT 'created' NOT NULL,
	"failure_reason" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_purpose_check" CHECK ("purpose" in ('shop_order', 'dues')),
	CONSTRAINT "payments_status_check" CHECK ("status" in ('created', 'paid', 'failed')),
	CONSTRAINT "payments_amount_check" CHECK ("amount_paise" > 0)
);--> statement-breakpoint
CREATE INDEX "payments_vendor_status_idx" ON "payments" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "payments_shop_order_idx" ON "payments" USING btree ("shop_order_id");--> statement-breakpoint
CREATE TABLE "vendor_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"amount_paise" integer NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"period" text,
	"requested_by" text NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_by" text,
	"processed_at" timestamp with time zone,
	"reference" text,
	"note" text,
	CONSTRAINT "vendor_payouts_status_check" CHECK ("status" in ('requested', 'paid', 'rejected')),
	CONSTRAINT "vendor_payouts_amount_check" CHECK ("amount_paise" > 0)
);--> statement-breakpoint
CREATE INDEX "vendor_payouts_vendor_idx" ON "vendor_payouts" USING btree ("vendor_id","status");
