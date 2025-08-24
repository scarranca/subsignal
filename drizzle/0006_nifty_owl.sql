CREATE TABLE "briefing" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"company_url" text NOT NULL,
	"briefing" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "briefing" ADD CONSTRAINT "briefing_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "briefing_company_id_idx" ON "briefing" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "briefing_created_at_idx" ON "briefing" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "briefing_company_created_idx" ON "briefing" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "briefing_company_url_idx" ON "briefing" USING btree ("company_url");