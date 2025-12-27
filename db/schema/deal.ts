import { pgTable, text, timestamp, boolean, integer, decimal, index, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { company } from './company';
import { contact } from './contact';
import { pipeline, pipelineStage } from './pipeline';

export const dealPriorityEnum = pgEnum('deal_priority', [
    'low',
    'medium',
    'high',
    'urgent',
]);

export const dealStatusEnum = pgEnum('deal_status', [
    'open',
    'won',
    'lost',
    'abandoned',
]);

export const deal = pgTable(
    'deal',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        companyId: text('company_id').references(() => company.id, { onDelete: 'set null' }),
        contactId: text('contact_id').references(() => contact.id, { onDelete: 'set null' }),
        pipelineId: text('pipeline_id')
            .notNull()
            .references(() => pipeline.id, { onDelete: 'cascade' }),
        stageId: text('stage_id')
            .notNull()
            .references(() => pipelineStage.id, { onDelete: 'cascade' }),

        // Deal info
        name: text('name').notNull(),
        description: text('description'),
        value: decimal('value', { precision: 15, scale: 2 }),
        currency: text('currency').default('USD').notNull(),
        probability: integer('probability'), // 0-100, overrides stage default

        // Priority and status
        priority: dealPriorityEnum('priority').default('medium').notNull(),
        status: dealStatusEnum('status').default('open').notNull(),

        // Dates
        expectedCloseDate: timestamp('expected_close_date'),
        actualCloseDate: timestamp('actual_close_date'),

        // Loss tracking
        lostReason: text('lost_reason'),
        competitorId: text('competitor_id'), // Reference to company if lost to competitor

        // Additional data
        tags: text('tags').array(),
        customFields: jsonb('custom_fields').$type<Record<string, unknown>>(),

        // AI-generated insights
        aiSummary: text('ai_summary'),
        aiNextSteps: text('ai_next_steps'),
        aiScore: integer('ai_score'), // AI-calculated deal health score 0-100

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
        index('deal_user_idx').on(table.userId),
        index('deal_user_active_idx').on(table.userId, table.isActive),
        index('deal_company_idx').on(table.companyId),
        index('deal_contact_idx').on(table.contactId),
        index('deal_pipeline_idx').on(table.pipelineId),
        index('deal_stage_idx').on(table.stageId),
        index('deal_user_status_idx').on(table.userId, table.status),
        index('deal_user_pipeline_stage_idx').on(table.userId, table.pipelineId, table.stageId),
        index('deal_expected_close_idx').on(table.userId, table.expectedCloseDate),
    ],
);

export type DealSelect = typeof deal.$inferSelect;
export type DealInsert = typeof deal.$inferInsert;
export type DealPriority = (typeof dealPriorityEnum.enumValues)[number];
export type DealStatus = (typeof dealStatusEnum.enumValues)[number];
