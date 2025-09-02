-- First, update existing data to new format
UPDATE "billing" 
SET "current_plan" = CASE 
    WHEN "current_plan" = 'solo_plan' THEN 'solo_plan_monthly'
    WHEN "current_plan" = 'team_plan' THEN 'team_plan_monthly'
    ELSE "current_plan"
END
WHERE "current_plan" IN ('solo_plan', 'team_plan');--> statement-breakpoint

-- Now update the enum
ALTER TABLE "billing" ALTER COLUMN "current_plan" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."plan";--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('solo_plan_monthly', 'team_plan_monthly', 'solo_plan_annually', 'team_plan_annually', 'custom_plan');--> statement-breakpoint
ALTER TABLE "billing" ALTER COLUMN "current_plan" SET DATA TYPE "public"."plan" USING "current_plan"::"public"."plan";