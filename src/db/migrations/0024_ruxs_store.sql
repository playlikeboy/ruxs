-- 0024: RUXs Store, a first-party kids shop run by RUXs itself (DIY kits, robotics,
-- science, art, puzzles, …). Its own store_* tables with no vendor_id, so store
-- sales never touch vendor balances, commission or payouts. Money is integer paise.
-- Stock lives on store_products and every change is logged in the insert-only
-- store_stock_movements, written in the same transaction.
CREATE TABLE IF NOT EXISTS "store_categories" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "emoji_icon" text DEFAULT 'Package' NOT NULL,
  "sort" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_products" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "category_id" text NOT NULL,
  "name" text NOT NULL,
  "tagline" text DEFAULT '' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "brand" text DEFAULT '' NOT NULL,
  "sku" text NOT NULL,
  "price_paise" integer NOT NULL,
  "mrp_paise" integer,
  "gst_bps" integer DEFAULT 1800 NOT NULL,
  "stock" integer DEFAULT 0 NOT NULL,
  "low_stock_at" integer DEFAULT 5 NOT NULL,
  "age_min" integer DEFAULT 0 NOT NULL,
  "age_max" integer,
  "skills" text[] DEFAULT '{}'::text[] NOT NULL,
  "box_contents" text[] DEFAULT '{}'::text[] NOT NULL,
  "safety_notes" text DEFAULT '' NOT NULL,
  "images" text[] DEFAULT '{}'::text[] NOT NULL,
  "weight_grams" integer,
  "is_featured" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_products_slug_unique" UNIQUE ("slug"),
  CONSTRAINT "store_products_sku_unique" UNIQUE ("sku"),
  CONSTRAINT "store_products_category_id_store_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "store_categories"("id") ON DELETE restrict,
  CONSTRAINT "store_products_price_check" CHECK ("price_paise" > 0),
  CONSTRAINT "store_products_mrp_check" CHECK ("mrp_paise" is null or "mrp_paise" >= "price_paise"),
  CONSTRAINT "store_products_stock_check" CHECK ("stock" >= 0),
  CONSTRAINT "store_products_age_check" CHECK ("age_min" >= 0 and ("age_max" is null or "age_min" <= "age_max")),
  CONSTRAINT "store_products_images_check" CHECK (cardinality("images") <= 6)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_products_category_idx" ON "store_products" USING btree ("category_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_settings" (
  "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
  "is_open" boolean DEFAULT true NOT NULL,
  "closed_message" text,
  "cod_enabled" boolean DEFAULT true NOT NULL,
  "cod_max_paise" integer,
  "delivery_fee_paise" integer DEFAULT 4000 NOT NULL,
  "free_delivery_above_paise" integer,
  "min_order_paise" integer DEFAULT 0 NOT NULL,
  "serviceability" text DEFAULT 'geofence' NOT NULL,
  "service_city" text DEFAULT 'Ranchi' NOT NULL,
  "service_latitude" double precision DEFAULT 23.3441 NOT NULL,
  "service_longitude" double precision DEFAULT 85.3096 NOT NULL,
  "service_radius_km" integer DEFAULT 25 NOT NULL,
  "dispatch_days" integer DEFAULT 1 NOT NULL,
  "updated_by" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_settings_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "store_settings_serviceability_check" CHECK ("serviceability" in ('geofence', 'india'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_order_counters" (
  "period" text PRIMARY KEY NOT NULL,
  "last_seq" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_orders" (
  "id" text PRIMARY KEY NOT NULL,
  "order_number" text NOT NULL,
  "user_id" text NOT NULL,
  "client_key" text NOT NULL,
  "status" text DEFAULT 'placed' NOT NULL,
  "payment_mode" text NOT NULL,
  "payment_status" text DEFAULT 'unpaid' NOT NULL,
  "subtotal_paise" integer NOT NULL,
  "delivery_fee_paise" integer DEFAULT 0 NOT NULL,
  "total_paise" integer NOT NULL,
  "customer_name" text NOT NULL,
  "phone" text NOT NULL,
  "address" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "notes" text,
  "courier" text,
  "tracking_number" text,
  "admin_note" text,
  "cancel_reason" text,
  "placed_at" timestamp with time zone,
  "packed_at" timestamp with time zone,
  "shipped_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "returned_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_orders_order_number_unique" UNIQUE ("order_number"),
  CONSTRAINT "store_orders_status_check" CHECK ("status" in ('awaiting_payment', 'placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  CONSTRAINT "store_orders_payment_mode_check" CHECK ("payment_mode" in ('online', 'cod')),
  CONSTRAINT "store_orders_payment_status_check" CHECK ("payment_status" in ('unpaid', 'paid', 'refund_due', 'refunded')),
  CONSTRAINT "store_orders_money_check" CHECK ("subtotal_paise" >= 0 and "delivery_fee_paise" >= 0 and "total_paise" = "subtotal_paise" + "delivery_fee_paise")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_orders_user_client_key_idx" ON "store_orders" USING btree ("user_id", "client_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_orders_user_idx" ON "store_orders" USING btree ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_orders_status_idx" ON "store_orders" USING btree ("status", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_order_items" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "product_id" text NOT NULL,
  "name" text NOT NULL,
  "image" text,
  "unit_price_paise" integer NOT NULL,
  "qty" integer NOT NULL,
  "line_total_paise" integer NOT NULL,
  CONSTRAINT "store_order_items_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE cascade,
  CONSTRAINT "store_order_items_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE restrict,
  CONSTRAINT "store_order_items_qty_check" CHECK ("qty" > 0),
  CONSTRAINT "store_order_items_total_check" CHECK ("line_total_paise" = "unit_price_paise" * "qty")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_order_items_order_idx" ON "store_order_items" USING btree ("order_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_payments" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "user_id" text NOT NULL,
  "razorpay_order_id" text NOT NULL,
  "razorpay_payment_id" text,
  "amount_paise" integer NOT NULL,
  "status" text DEFAULT 'created' NOT NULL,
  "failure_reason" text,
  "refund_id" text,
  "paid_at" timestamp with time zone,
  "refunded_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_payments_razorpay_order_id_unique" UNIQUE ("razorpay_order_id"),
  CONSTRAINT "store_payments_razorpay_payment_id_unique" UNIQUE ("razorpay_payment_id"),
  CONSTRAINT "store_payments_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE cascade,
  CONSTRAINT "store_payments_status_check" CHECK ("status" in ('created', 'paid', 'failed')),
  CONSTRAINT "store_payments_amount_check" CHECK ("amount_paise" > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_payments_order_idx" ON "store_payments" USING btree ("order_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_stock_movements" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL,
  "delta" integer NOT NULL,
  "stock_after" integer NOT NULL,
  "reason" text NOT NULL,
  "order_id" text,
  "actor" text NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_stock_movements_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE restrict,
  CONSTRAINT "store_stock_movements_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id"),
  CONSTRAINT "store_stock_movements_reason_check" CHECK ("reason" in ('restock', 'order', 'cancel', 'adjust')),
  CONSTRAINT "store_stock_movements_delta_check" CHECK ("delta" <> 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_stock_movements_product_idx" ON "store_stock_movements" USING btree ("product_id", "created_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION block_store_stock_movements_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'store_stock_movements is insert-only: record a new movement instead';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trigger_block_store_stock_movements_mutation ON store_stock_movements;
--> statement-breakpoint
CREATE TRIGGER trigger_block_store_stock_movements_mutation
BEFORE UPDATE OR DELETE ON store_stock_movements
FOR EACH ROW EXECUTE FUNCTION block_store_stock_movements_mutation();
--> statement-breakpoint
INSERT INTO "store_categories" ("id", "name", "description", "emoji_icon", "sort") VALUES
  ('diy-craft-kits', 'DIY & craft kits', 'Make-it-yourself kits with everything in the box.', 'Scissors', 0),
  ('robotics-electronics', 'Robotics & electronics', 'Build and program robots, circuits and gadgets.', 'Bot', 1),
  ('science-lab-kits', 'Science & lab kits', 'Hands-on experiments for curious minds.', 'FlaskConical', 2),
  ('coding-stem-toys', 'Coding & STEM toys', 'Learn logic and coding through play.', 'Code', 3),
  ('art-painting', 'Art & painting supplies', 'Colours, brushes, canvases and sketch books.', 'Palette', 4),
  ('puzzles-brain-games', 'Puzzles & brain games', 'Jigsaws, logic puzzles and memory games.', 'Puzzle', 5),
  ('building-blocks', 'Building blocks & construction', 'Blocks, bricks and construction sets.', 'Blocks', 6),
  ('board-card-games', 'Board games & card games', 'Games for the whole family.', 'Dices', 7),
  ('books-workbooks', 'Books & activity workbooks', 'Story books and activity workbooks.', 'BookOpen', 8),
  ('musical-toys', 'Musical toys & instruments', 'First instruments and musical toys.', 'Music', 9),
  ('outdoor-sports', 'Outdoor & sports play', 'Balls, skipping ropes and outdoor play.', 'Volleyball', 10),
  ('montessori-early-learning', 'Montessori & early learning (0–5)', 'Gentle learning toys for little ones.', 'Baby', 11),
  ('school-stationery', 'School & stationery', 'Notebooks, pencils and school supplies.', 'PencilRuler', 12),
  ('party-gift-hampers', 'Party & gift hampers', 'Return gifts and ready hampers.', 'Gift', 13),
  ('spare-parts-refills', 'Spare parts & refills', 'Batteries, motors, sensors and paint refills.', 'Wrench', 14)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "store_settings" ("id", "is_open", "cod_enabled", "cod_max_paise", "delivery_fee_paise", "free_delivery_above_paise", "min_order_paise", "serviceability", "service_city", "service_latitude", "service_longitude", "service_radius_km", "dispatch_days")
VALUES (1, true, true, 300000, 4000, 49900, 0, 'geofence', 'Ranchi', 23.3441, 85.3096, 25, 1)
ON CONFLICT ("id") DO NOTHING;
