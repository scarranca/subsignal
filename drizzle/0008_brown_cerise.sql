ALTER TYPE "public"."frequency" ADD VALUE '3_day' BEFORE '7_day';--> statement-breakpoint
ALTER TABLE "billing" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "billing" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."entitlement_status";--> statement-breakpoint
CREATE TYPE "public"."entitlement_status" AS ENUM('active', 'inactive');--> statement-breakpoint
ALTER TABLE "billing" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."entitlement_status";--> statement-breakpoint
ALTER TABLE "billing" ALTER COLUMN "status" SET DATA TYPE "public"."entitlement_status" USING "status"::"public"."entitlement_status";--> statement-breakpoint
ALTER TABLE "billing" ALTER COLUMN "current_plan" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."plan";--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('solo_plan', 'team_plan', 'custom_plan');--> statement-breakpoint
ALTER TABLE "billing" ALTER COLUMN "current_plan" SET DATA TYPE "public"."plan" USING "current_plan"::"public"."plan";--> statement-breakpoint
ALTER TABLE "billing" ADD COLUMN "product_id" text;--> statement-breakpoint
ALTER TABLE "billing" ADD COLUMN "webhook_event" text;