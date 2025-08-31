DROP INDEX "billing_status_plan_idx";--> statement-breakpoint
DROP INDEX "briefing_company_id_idx";--> statement-breakpoint
DROP INDEX "briefing_company_url_idx";--> statement-breakpoint
DROP INDEX "company_user_id_idx";--> statement-breakpoint
DROP INDEX "company_active_idx";--> statement-breakpoint
DROP INDEX "company_name_idx";--> statement-breakpoint
DROP INDEX "company_url_idx";--> statement-breakpoint
DROP INDEX "page_company_id_idx";--> statement-breakpoint
DROP INDEX "page_active_idx";--> statement-breakpoint
DROP INDEX "page_title_idx";--> statement-breakpoint
DROP INDEX "page_url_idx";--> statement-breakpoint
DROP INDEX "snapshot_page_id_idx";--> statement-breakpoint
DROP INDEX "snapshot_page_url_idx";--> statement-breakpoint
CREATE INDEX "billing_user_status_idx" ON "billing" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "company_user_active_idx" ON "company" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "company_user_active_id_idx" ON "company" USING btree ("user_id","is_active","id");--> statement-breakpoint
CREATE INDEX "company_url_user_idx" ON "company" USING btree ("url","user_id");--> statement-breakpoint
CREATE INDEX "page_company_active_idx" ON "page" USING btree ("company_id","is_active");--> statement-breakpoint
CREATE INDEX "page_company_active_created_idx" ON "page" USING btree ("company_id","is_active","created_at");--> statement-breakpoint
CREATE INDEX "snapshot_page_url_compound_idx" ON "snapshot" USING btree ("page_id","page_url");