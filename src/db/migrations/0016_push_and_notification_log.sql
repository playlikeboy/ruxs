CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "endpoint" text NOT NULL UNIQUE,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_log" (
  "key" text PRIMARY KEY NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Was only ever created with drizzle push; make fresh databases match the schema.
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "user_id" text PRIMARY KEY NOT NULL,
  "email_orders" boolean DEFAULT true NOT NULL,
  "email_plans" boolean DEFAULT true NOT NULL,
  "email_bills" boolean DEFAULT true NOT NULL,
  "email_reviews" boolean DEFAULT true NOT NULL,
  "pwa_push" boolean DEFAULT true NOT NULL,
  "push_subscription" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
