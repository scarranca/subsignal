CREATE TYPE "public"."entitlement_status" AS ENUM('active', 'failed', 'renewed', 'on_hold', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('solo_plan', 'team_plan', 'enterprise_plan');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('dodo');--> statement-breakpoint
CREATE TABLE "billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "entitlement_status" DEFAULT 'active' NOT NULL,
	"current_plan" "plan",
	"provider" "provider" DEFAULT 'dodo' NOT NULL,
	"subscription_id" text,
	"customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing" ADD CONSTRAINT "billing_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_user_uidx" ON "billing" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscription_uidx" ON "billing" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "billing_status_plan_idx" ON "billing" USING btree ("status","current_plan");--> statement-breakpoint
CREATE INDEX "billing_provider_customer_idx" ON "billing" USING btree ("provider","customer_id");