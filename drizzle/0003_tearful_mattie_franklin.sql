CREATE TABLE "background_jobs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"job_name" varchar(100) NOT NULL,
	"job_key" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'RUNNING' NOT NULL,
	"result" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "background_jobs_job_key_unique" UNIQUE("job_key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(36),
	"customer_id" varchar(36),
	"recipient_phone" varchar(20) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"fallback_channel" varchar(20),
	"provider_message_id" varchar(100),
	"scheduled_time" timestamp with time zone,
	"sent_time" timestamp with time zone,
	"failed_time" timestamp with time zone,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"idempotency_key" varchar(128),
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(50),
	"payload" text,
	"status" varchar(30) DEFAULT 'PROCESSED' NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "payments_gateway_order_idx";--> statement-breakpoint
ALTER TABLE "daily_fulfillments" ADD COLUMN "late_fee_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "previous_balance_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "background_jobs_key_idx" ON "background_jobs" USING btree ("job_key");--> statement-breakpoint
CREATE INDEX "background_jobs_status_name_idx" ON "background_jobs" USING btree ("status","job_name");--> statement-breakpoint
CREATE INDEX "notifications_status_scheduled_idx" ON "notifications" USING btree ("status","scheduled_time");--> statement-breakpoint
CREATE INDEX "notifications_tenant_cust_idx" ON "notifications" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_idempotency_idx" ON "notifications" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_idx" ON "webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "webhook_events_processed_at_idx" ON "webhook_events" USING btree ("processed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_tenant_customer_period_idx" ON "invoices" USING btree ("tenant_id","customer_id","period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gateway_order_unique_idx" ON "payments" USING btree ("gateway_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gateway_payment_unique_idx" ON "payments" USING btree ("gateway_payment_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_order_id_unique" UNIQUE("gateway_order_id");