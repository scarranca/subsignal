CREATE TYPE "public"."activity_action" AS ENUM('created', 'updated', 'deleted', 'restored', 'stage_changed', 'status_changed', 'assigned', 'unassigned', 'commented', 'mentioned', 'email_sent', 'email_received', 'call_made', 'call_received', 'meeting_scheduled', 'meeting_completed', 'deal_won', 'deal_lost', 'task_completed');--> statement-breakpoint
CREATE TYPE "public"."activity_entity_type" AS ENUM('company', 'contact', 'deal', 'interaction', 'task', 'pipeline');--> statement-breakpoint
CREATE TYPE "public"."api_key_scope" AS ENUM('contacts:read', 'contacts:write', 'companies:read', 'companies:write', 'deals:read', 'deals:write', 'interactions:read', 'interactions:write', 'tasks:read', 'tasks:write', 'all:read', 'all:write');--> statement-breakpoint
CREATE TYPE "public"."company_size" AS ENUM('startup', 'small', 'medium', 'large', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('prospect', 'customer', 'partner', 'competitor', 'vendor', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_source" AS ENUM('manual', 'import', 'linkedin', 'referral', 'website', 'email', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."custom_field_entity_type" AS ENUM('company', 'contact', 'deal');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('text', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'url', 'email', 'phone', 'currency', 'percent', 'textarea');--> statement-breakpoint
CREATE TYPE "public"."deal_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."deal_status" AS ENUM('open', 'won', 'lost', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('google', 'microsoft', 'slack', 'hubspot', 'salesforce');--> statement-breakpoint
CREATE TYPE "public"."interaction_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."interaction_outcome" AS ENUM('positive', 'neutral', 'negative', 'no_answer', 'left_voicemail', 'scheduled_followup');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('call', 'email', 'meeting', 'note', 'linkedin_message', 'text_message', 'other');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('idle', 'syncing', 'success', 'error', 'paused');--> statement-breakpoint
CREATE TYPE "public"."tag_entity_type" AS ENUM('company', 'contact', 'deal', 'interaction', 'task');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('call', 'email', 'meeting', 'follow_up', 'proposal', 'research', 'demo', 'other');--> statement-breakpoint
CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" "activity_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"entity_name" text,
	"related_company_id" text,
	"related_contact_id" text,
	"related_deal_id" text,
	"action" "activity_action" NOT NULL,
	"description" text,
	"changes" jsonb,
	"metadata" jsonb,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"rate_limit" integer DEFAULT 1000 NOT NULL,
	"rate_limit_window" integer DEFAULT 3600 NOT NULL,
	"allowed_ips" jsonb,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key_log" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
	"user_id" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status_code" integer NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"response_time" integer,
	"rate_limit_remaining" integer,
	"error_message" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" jsonb NOT NULL,
	"headers" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_delivery_at" timestamp,
	"last_delivery_status" text,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"disabled_at" timestamp,
	"disabled_reason" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status_code" integer,
	"response_body" text,
	"response_time" integer,
	"attempt" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp,
	"success" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"owner_id" text,
	"company_id" text,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"phone" text,
	"title" text,
	"department" text,
	"linkedin_url" text,
	"twitter_url" text,
	"status" "contact_status" DEFAULT 'active' NOT NULL,
	"source" "contact_source" DEFAULT 'manual' NOT NULL,
	"avatar_url" text,
	"notes" text,
	"custom_fields" jsonb,
	"last_contacted_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" "custom_field_entity_type" NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"field_type" "custom_field_type" NOT NULL,
	"description" text,
	"placeholder" text,
	"default_value" jsonb,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_value" integer,
	"max_value" integer,
	"pattern" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"show_in_list" boolean DEFAULT false NOT NULL,
	"show_in_card" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_value" (
	"id" text PRIMARY KEY NOT NULL,
	"custom_field_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"value" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"owner_id" text,
	"company_id" text,
	"contact_id" text,
	"pipeline_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"value" numeric(15, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"probability" integer,
	"priority" "deal_priority" DEFAULT 'medium' NOT NULL,
	"status" "deal_status" DEFAULT 'open' NOT NULL,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"lost_reason" text,
	"competitor_id" text,
	"tags" text[],
	"custom_fields" jsonb,
	"ai_summary" text,
	"ai_next_steps" text,
	"ai_score" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_sync" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"calendar_id" text NOT NULL,
	"summary" text,
	"description" text,
	"location" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"timezone" text,
	"attendees" jsonb,
	"organizer_email" text,
	"meeting_link" text,
	"conference_type" text,
	"status" text,
	"interaction_id" text,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"task_id" text,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"etag" text,
	"last_updated_external" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sync" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"user_id" text NOT NULL,
	"message_id" text NOT NULL,
	"thread_id" text,
	"subject" text,
	"from_email" text,
	"from_name" text,
	"to_emails" jsonb,
	"cc_emails" jsonb,
	"snippet" text,
	"body_text" text,
	"body_html" text,
	"email_date" timestamp NOT NULL,
	"received_at" timestamp,
	"interaction_id" text,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"labels" jsonb,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"tag_id" text NOT NULL,
	"entity_type" "tag_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"account_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"connected_email" text,
	"connected_name" text,
	"gmail_enabled" boolean DEFAULT false NOT NULL,
	"calendar_enabled" boolean DEFAULT false NOT NULL,
	"sync_emails" boolean DEFAULT true NOT NULL,
	"sync_calendar" boolean DEFAULT true NOT NULL,
	"sync_contacts_from_email" boolean DEFAULT false NOT NULL,
	"last_email_sync" timestamp,
	"last_calendar_sync" timestamp,
	"email_sync_status" "sync_status" DEFAULT 'idle' NOT NULL,
	"calendar_sync_status" "sync_status" DEFAULT 'idle' NOT NULL,
	"gmail_history_id" text,
	"calendar_sync_token" text,
	"last_error" text,
	"last_error_at" timestamp,
	"error_count" integer DEFAULT 0 NOT NULL,
	"settings" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interaction" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"company_id" text,
	"contact_id" text,
	"deal_id" text,
	"type" "interaction_type" NOT NULL,
	"direction" "interaction_direction",
	"outcome" "interaction_outcome",
	"subject" text,
	"content" text,
	"summary" text,
	"scheduled_at" timestamp,
	"occurred_at" timestamp NOT NULL,
	"duration" integer,
	"email_message_id" text,
	"email_thread_id" text,
	"attachments" jsonb,
	"metadata" jsonb,
	"ai_sentiment" text,
	"ai_key_points" text[],
	"ai_action_items" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"default_pipeline_id" text,
	"timezone" text DEFAULT 'UTC',
	"date_format" text DEFAULT 'MM/DD/YYYY',
	"currency" text DEFAULT 'USD',
	"max_members" text DEFAULT '5',
	"max_contacts" text DEFAULT '1000',
	"max_deals" text DEFAULT '500',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_by" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "org_role" DEFAULT 'member' NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"invited_by" text NOT NULL,
	CONSTRAINT "organization_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organization_member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "org_role" DEFAULT 'member' NOT NULL,
	"title" text,
	"department" text,
	"can_be_assigned" boolean DEFAULT true,
	"joined_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"invited_by" text
);
--> statement-breakpoint
CREATE TABLE "pipeline" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"pipeline_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6B7280' NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"is_won_stage" boolean DEFAULT false NOT NULL,
	"is_lost_stage" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6B7280' NOT NULL,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_to_id" text,
	"company_id" text,
	"contact_id" text,
	"deal_id" text,
	"title" text NOT NULL,
	"description" text,
	"type" "task_type" DEFAULT 'other' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"reminder_at" timestamp,
	"completed_at" timestamp,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_pattern" jsonb,
	"tags" text[],
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_organization" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_organization_id" text,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_organization_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DROP INDEX "company_user_active_idx";--> statement-breakpoint
DROP INDEX "company_user_active_id_idx";--> statement-breakpoint
DROP INDEX "company_url_user_idx";--> statement-breakpoint
ALTER TABLE "company" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "type" "company_type" DEFAULT 'prospect' NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "size" "company_size";--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "annual_revenue" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "employee_count" integer;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "founded_year" integer;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "address" jsonb;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "custom_fields" jsonb;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "ai_insights" jsonb;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "monitoring_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_log" ADD CONSTRAINT "api_key_log_api_key_id_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_key"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_log" ADD CONSTRAINT "api_key_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_id_webhook_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field" ADD CONSTRAINT "custom_field_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_custom_field_id_custom_field_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_pipeline_id_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_stage_id_pipeline_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync" ADD CONSTRAINT "calendar_sync_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync" ADD CONSTRAINT "calendar_sync_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sync" ADD CONSTRAINT "email_sync_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sync" ADD CONSTRAINT "email_sync_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tag" ADD CONSTRAINT "entity_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration" ADD CONSTRAINT "integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline" ADD CONSTRAINT "pipeline_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline" ADD CONSTRAINT "pipeline_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stage" ADD CONSTRAINT "pipeline_stage_pipeline_id_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_current_organization_id_organization_id_fk" FOREIGN KEY ("current_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_org_idx" ON "activity" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "activity_entity_idx" ON "activity" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "activity_org_occurred_idx" ON "activity" USING btree ("organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "activity_company_idx" ON "activity" USING btree ("related_company_id");--> statement-breakpoint
CREATE INDEX "activity_contact_idx" ON "activity" USING btree ("related_contact_id");--> statement-breakpoint
CREATE INDEX "activity_deal_idx" ON "activity" USING btree ("related_deal_id");--> statement-breakpoint
CREATE INDEX "activity_org_action_idx" ON "activity" USING btree ("organization_id","action");--> statement-breakpoint
CREATE INDEX "api_key_user_id_idx" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_key_key_prefix_idx" ON "api_key" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_key_is_active_idx" ON "api_key" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_key_log_api_key_id_idx" ON "api_key_log" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "api_key_log_user_id_idx" ON "api_key_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_key_log_created_at_idx" ON "api_key_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_user_id_idx" ON "webhook" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_is_active_idx" ON "webhook" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "webhook_delivery_webhook_id_idx" ON "webhook_delivery" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_user_id_idx" ON "webhook_delivery" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_created_at_idx" ON "webhook_delivery" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_delivery_next_retry_idx" ON "webhook_delivery" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "contact_org_idx" ON "contact" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contact_org_active_idx" ON "contact" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "contact_company_idx" ON "contact" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "contact_email_idx" ON "contact" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contact_org_status_idx" ON "contact" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "contact_last_contacted_idx" ON "contact" USING btree ("organization_id","last_contacted_at");--> statement-breakpoint
CREATE INDEX "contact_owner_idx" ON "contact" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "custom_field_user_idx" ON "custom_field" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custom_field_entity_type_idx" ON "custom_field" USING btree ("user_id","entity_type");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_field_user_entity_name_idx" ON "custom_field" USING btree ("user_id","entity_type","name");--> statement-breakpoint
CREATE INDEX "custom_field_value_field_idx" ON "custom_field_value" USING btree ("custom_field_id");--> statement-breakpoint
CREATE INDEX "custom_field_value_entity_idx" ON "custom_field_value" USING btree ("entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_field_value_unique_idx" ON "custom_field_value" USING btree ("custom_field_id","entity_id");--> statement-breakpoint
CREATE INDEX "deal_org_idx" ON "deal" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "deal_org_active_idx" ON "deal" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "deal_company_idx" ON "deal" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "deal_contact_idx" ON "deal" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "deal_pipeline_idx" ON "deal" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "deal_stage_idx" ON "deal" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "deal_org_status_idx" ON "deal" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "deal_org_pipeline_stage_idx" ON "deal" USING btree ("organization_id","pipeline_id","stage_id");--> statement-breakpoint
CREATE INDEX "deal_expected_close_idx" ON "deal" USING btree ("organization_id","expected_close_date");--> statement-breakpoint
CREATE INDEX "deal_owner_idx" ON "deal" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "calendar_sync_integration_id_idx" ON "calendar_sync" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "calendar_sync_user_id_idx" ON "calendar_sync" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_sync_event_id_idx" ON "calendar_sync" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "calendar_sync_start_time_idx" ON "calendar_sync" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "calendar_sync_contact_id_idx" ON "calendar_sync" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "email_sync_integration_id_idx" ON "email_sync" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "email_sync_user_id_idx" ON "email_sync" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_sync_message_id_idx" ON "email_sync" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_sync_from_email_idx" ON "email_sync" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX "email_sync_contact_id_idx" ON "email_sync" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "entity_tag_tag_idx" ON "entity_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "entity_tag_entity_idx" ON "entity_tag" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_tag_unique_idx" ON "entity_tag" USING btree ("tag_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "integration_user_id_idx" ON "integration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "integration_provider_idx" ON "integration" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "integration_user_provider_idx" ON "integration" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "interaction_org_idx" ON "interaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "interaction_company_idx" ON "interaction" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "interaction_contact_idx" ON "interaction" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "interaction_deal_idx" ON "interaction" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "interaction_org_type_idx" ON "interaction" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "interaction_occurred_at_idx" ON "interaction" USING btree ("organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "interaction_email_thread_idx" ON "interaction" USING btree ("email_thread_id");--> statement-breakpoint
CREATE INDEX "organization_slug_idx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organization_created_by_idx" ON "organization" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "organization_invite_org_idx" ON "organization_invite" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invite_email_idx" ON "organization_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "organization_invite_token_idx" ON "organization_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_invite_status_idx" ON "organization_invite" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_member_unique_idx" ON "organization_member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_member_org_idx" ON "organization_member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_member_user_idx" ON "organization_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_member_role_idx" ON "organization_member" USING btree ("role");--> statement-breakpoint
CREATE INDEX "pipeline_org_idx" ON "pipeline" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "pipeline_org_default_idx" ON "pipeline" USING btree ("organization_id","is_default");--> statement-breakpoint
CREATE INDEX "pipeline_stage_pipeline_idx" ON "pipeline_stage" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "pipeline_stage_position_idx" ON "pipeline_stage" USING btree ("pipeline_id","position");--> statement-breakpoint
CREATE INDEX "tag_user_idx" ON "tag" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_user_name_idx" ON "tag" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "task_org_idx" ON "task" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "task_assigned_to_idx" ON "task" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "task_company_idx" ON "task" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "task_contact_idx" ON "task" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "task_deal_idx" ON "task" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "task_org_status_idx" ON "task" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "task_org_due_date_idx" ON "task" USING btree ("organization_id","due_date");--> statement-breakpoint
CREATE INDEX "task_org_priority_status_idx" ON "task" USING btree ("organization_id","priority","status");--> statement-breakpoint
CREATE INDEX "user_organization_user_idx" ON "user_organization" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_org_idx" ON "company" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "company_org_active_idx" ON "company" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "company_org_active_id_idx" ON "company" USING btree ("organization_id","is_active","id");--> statement-breakpoint
CREATE INDEX "company_url_org_idx" ON "company" USING btree ("url","organization_id");--> statement-breakpoint
CREATE INDEX "company_org_type_idx" ON "company" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "company_org_industry_idx" ON "company" USING btree ("organization_id","industry");--> statement-breakpoint
CREATE INDEX "company_owner_idx" ON "company" USING btree ("owner_id");