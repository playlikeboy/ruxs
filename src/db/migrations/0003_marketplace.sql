ALTER TABLE "vendors" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "service_radius_km" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "delivery_fee_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "min_order_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "accepting_orders" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "section" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_veg" boolean;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_available" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allow_subscription" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allow_one_time" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_kind_check";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_kind_check" CHECK ("products"."kind" in ('tiffin', 'water', 'milk', 'other'));--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "user_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_vendor_user_idx" ON "customers" USING btree ("vendor_id","user_id");--> statement-breakpoint
CREATE TABLE "consumers" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"society" text NOT NULL,
	"tower" text NOT NULL,
	"floor" text NOT NULL,
	"flat" text NOT NULL,
	"landmark" text,
	"area" text NOT NULL,
	"city" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "shop_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL UNIQUE,
	"client_key" text NOT NULL UNIQUE,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"customer_id" text NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"payment_mode" text NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"delivery_fee_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer NOT NULL,
	"deliver_on" date NOT NULL,
	"slot" text NOT NULL,
	"address" text NOT NULL,
	"notes" text,
	"cancel_reason" text,
	"accepted_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_orders_status_check" CHECK ("status" in ('placed', 'accepted', 'out_for_delivery', 'delivered', 'cancelled', 'rejected')),
	CONSTRAINT "shop_orders_payment_check" CHECK ("payment_mode" in ('cod', 'monthly_bill')),
	CONSTRAINT "shop_orders_slot_check" CHECK ("slot" in ('asap', 'morning', 'lunch', 'evening', 'dinner'))
);--> statement-breakpoint
CREATE INDEX "shop_orders_vendor_status_idx" ON "shop_orders" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "shop_orders_user_idx" ON "shop_orders" USING btree ("user_id");--> statement-breakpoint
CREATE TABLE "shop_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL REFERENCES "shop_orders"("id") ON DELETE cascade,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE cascade,
	"product_id" text REFERENCES "products"("id") ON DELETE set null,
	"name" text NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"qty" integer NOT NULL,
	"line_total_paise" integer NOT NULL,
	CONSTRAINT "shop_order_items_qty_check" CHECK ("qty" > 0)
);--> statement-breakpoint
CREATE INDEX "shop_order_items_order_idx" ON "shop_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_order_items_order_product_idx" ON "shop_order_items" USING btree ("order_id","product_id");
