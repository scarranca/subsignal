import { pgTable, text, timestamp, boolean, integer, index, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { organization } from './organization';
import { company } from './company';
import { contact } from './contact';
import { deal } from './deal';

export const interactionTypeEnum = pgEnum('interaction_type', [
    'call',
    'email',
    'meeting',
    'note',
    'linkedin_message',
    'text_message',
    'other',
]);

export const interactionDirectionEnum = pgEnum('interaction_direction', [
    'inbound',
    'outbound',
]);

export const interactionOutcomeEnum = pgEnum('interaction_outcome', [
    'positive',
    'neutral',
    'negative',
    'no_answer',
    'left_voicemail',
    'scheduled_followup',
]);

export const interaction = pgTable(
    'interaction',
    {
        id: text('id').primaryKey(),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        companyId: text('company_id').references(() => company.id, { onDelete: 'set null' }),
        contactId: text('contact_id').references(() => contact.id, { onDelete: 'set null' }),
        dealId: text('deal_id').references(() => deal.id, { onDelete: 'set null' }),

        // Interaction details
        type: interactionTypeEnum('type').notNull(),
        direction: interactionDirectionEnum('direction'),
        outcome: interactionOutcomeEnum('outcome'),

        // Content
        subject: text('subject'),
        content: text('content'), // Rich text / markdown
        summary: text('summary'), // AI-generated summary

        // Timing
        scheduledAt: timestamp('scheduled_at'),
        occurredAt: timestamp('occurred_at')
            .$defaultFn(() => new Date())
            .notNull(),
        duration: integer('duration'), // Duration in minutes

        // Email-specific fields
        emailMessageId: text('email_message_id'),
        emailThreadId: text('email_thread_id'),

        // Attachments and metadata
        attachments: jsonb('attachments').$type<Array<{
            name: string;
            url: string;
            type: string;
            size: number;
        }>>(),
        metadata: jsonb('metadata').$type<Record<string, unknown>>(),

        // AI enhancements
        aiSentiment: text('ai_sentiment'), // positive, neutral, negative
        aiKeyPoints: text('ai_key_points').array(),
        aiActionItems: text('ai_action_items').array(),

        // Metadata
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('interaction_org_idx').on(table.organizationId),
        index('interaction_company_idx').on(table.companyId),
        index('interaction_contact_idx').on(table.contactId),
        index('interaction_deal_idx').on(table.dealId),
        index('interaction_org_type_idx').on(table.organizationId, table.type),
        index('interaction_occurred_at_idx').on(table.organizationId, table.occurredAt),
        index('interaction_email_thread_idx').on(table.emailThreadId),
    ],
);

export type InteractionSelect = typeof interaction.$inferSelect;
export type InteractionInsert = typeof interaction.$inferInsert;
export type InteractionType = (typeof interactionTypeEnum.enumValues)[number];
export type InteractionDirection = (typeof interactionDirectionEnum.enumValues)[number];
export type InteractionOutcome = (typeof interactionOutcomeEnum.enumValues)[number];
