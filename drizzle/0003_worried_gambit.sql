CREATE TABLE "snapshot" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"page_url" text NOT NULL,
	"diff" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "snapshot" ADD CONSTRAINT "snapshot_page_id_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snapshot_page_id_idx" ON "snapshot" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "snapshot_created_at_idx" ON "snapshot" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "snapshot_page_created_idx" ON "snapshot" USING btree ("page_id","created_at");--> statement-breakpoint
CREATE INDEX "snapshot_page_url_idx" ON "snapshot" USING btree ("page_url");