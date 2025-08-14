CREATE TYPE "public"."frequency" AS ENUM('7_day', '15_day', '1_month', '3_month', '6_month');--> statement-breakpoint
CREATE TYPE "public"."properties" AS ENUM('pricing', 'product', 'customer', 'partnership', 'branding', 'messaging');--> statement-breakpoint
CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preference" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"properties" text[] NOT NULL,
	"frequency" "frequency" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "preference_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preference" ADD CONSTRAINT "preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_user_id_idx" ON "company" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "company_active_idx" ON "company" USING btree ("is_active","user_id");--> statement-breakpoint
CREATE INDEX "company_name_idx" ON "company" USING btree ("name");--> statement-breakpoint
CREATE INDEX "page_company_id_idx" ON "page" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "page_active_idx" ON "page" USING btree ("is_active","company_id");--> statement-breakpoint
CREATE INDEX "page_title_idx" ON "page" USING btree ("title");--> statement-breakpoint
CREATE INDEX "page_url_idx" ON "page" USING btree ("url");