CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"shift" text NOT NULL,
	"price_paise" integer NOT NULL,
	"deposit_paise" integer DEFAULT 0 NOT NULL,
	"asset_name" text,
	"poll_at" text,
	"cutoff_at" text NOT NULL,
	"late_rule" text DEFAULT 'full' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_kind_check" CHECK ("products"."kind" in ('tiffin', 'water')),
	CONSTRAINT "products_shift_check" CHECK ("products"."shift" in ('lunch', 'dinner', 'morning', 'evening')),
	CONSTRAINT "products_late_rule_check" CHECK ("products"."late_rule" in ('free', 'half', 'full', 'locked'))
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"product_id" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"days" text[] NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"society" text NOT NULL,
	"tower" text NOT NULL,
	"floor" text NOT NULL,
	"flat" text NOT NULL,
	"opted_in_at" timestamp with time zone,
	"link_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_link_token_hash_unique" UNIQUE("link_token_hash")
);
--> statement-breakpoint
CREATE TABLE "vendor_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"created_by" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_invites_role_check" CHECK ("vendor_invites"."role" in ('staff', 'driver'))
);
--> statement-breakpoint
CREATE TABLE "vendor_members" (
	"vendor_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_members_vendor_id_user_id_pk" PRIMARY KEY("vendor_id","user_id"),
	CONSTRAINT "vendor_members_role_check" CHECK ("vendor_members"."role" in ('owner', 'staff', 'driver'))
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"upi_vpa" text NOT NULL,
	"city" text NOT NULL,
	"area" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_slug_unique" UNIQUE("slug"),
	CONSTRAINT "vendors_plan_check" CHECK ("vendors"."plan" in ('free', 'starter', 'pro')),
	CONSTRAINT "vendors_status_check" CHECK ("vendors"."status" in ('pending', 'active', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "day_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"service_date" date NOT NULL,
	"kind" text NOT NULL,
	"qty" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'link' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_late" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_changes_kind_check" CHECK ("day_changes"."kind" in ('skip', 'extra', 'qty')),
	CONSTRAINT "day_changes_source_check" CHECK ("day_changes"."source" in ('link', 'vendor', 'pause'))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"product_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"service_date" date NOT NULL,
	"shift" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"delivered_at" timestamp with time zone,
	"delivered_by" text,
	"failed_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_status_check" CHECK ("orders"."status" in ('confirmed', 'skipped', 'late_skip', 'delivered', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "asset_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"order_id" text,
	"asset" text NOT NULL,
	"delta" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"period" text NOT NULL,
	"number" text NOT NULL,
	"opening_paise" integer DEFAULT 0 NOT NULL,
	"charges_paise" integer DEFAULT 0 NOT NULL,
	"payments_paise" integer DEFAULT 0 NOT NULL,
	"closing_paise" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'generated' NOT NULL,
	"sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_status_check" CHECK ("invoices"."status" in ('draft', 'generated', 'sent', 'paid', 'partially_paid'))
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"order_id" text,
	"invoice_id" text,
	"type" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"notes" text,
	"idempotency_key" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "ledger_entries_type_check" CHECK ("ledger_entries"."type" in ('delivery', 'late_fee', 'deposit', 'deposit_refund', 'payment', 'adjustment'))
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invites" ADD CONSTRAINT "vendor_invites_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_members" ADD CONSTRAINT "vendor_members_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_changes" ADD CONSTRAINT "day_changes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_changes" ADD CONSTRAINT "day_changes_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_vendor_idx" ON "products" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "subscriptions_vendor_customer_idx" ON "subscriptions" USING btree ("vendor_id","customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_vendor_product_idx" ON "subscriptions" USING btree ("vendor_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_vendor_phone_idx" ON "customers" USING btree ("vendor_id","phone");--> statement-breakpoint
CREATE INDEX "customers_vendor_run_idx" ON "customers" USING btree ("vendor_id","society","tower","floor");--> statement-breakpoint
CREATE INDEX "customers_link_token_hash_idx" ON "customers" USING btree ("link_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_invites_vendor_email_idx" ON "vendor_invites" USING btree ("vendor_id","email");--> statement-breakpoint
CREATE INDEX "vendor_invites_email_idx" ON "vendor_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vendor_members_user_id_idx" ON "vendor_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vendors_slug_idx" ON "vendors" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "day_changes_sub_date_idx" ON "day_changes" USING btree ("subscription_id","service_date");--> statement-breakpoint
CREATE INDEX "day_changes_vendor_date_idx" ON "day_changes" USING btree ("vendor_id","service_date");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_sub_date_shift_idx" ON "orders" USING btree ("subscription_id","service_date","shift");--> statement-breakpoint
CREATE INDEX "orders_vendor_date_shift_idx" ON "orders" USING btree ("vendor_id","service_date","shift");--> statement-breakpoint
CREATE INDEX "orders_vendor_customer_idx" ON "orders" USING btree ("vendor_id","customer_id");--> statement-breakpoint
CREATE INDEX "asset_movements_vendor_cust_asset_idx" ON "asset_movements" USING btree ("vendor_id","customer_id","asset");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_vendor_cust_period_idx" ON "invoices" USING btree ("vendor_id","customer_id","period");--> statement-breakpoint
CREATE INDEX "invoices_vendor_period_idx" ON "invoices" USING btree ("vendor_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entries_idempotency_idx" ON "ledger_entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "ledger_entries_vendor_cust_idx" ON "ledger_entries" USING btree ("vendor_id","customer_id");