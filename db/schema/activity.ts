import { pgTable, text, timestamp, index, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const activityEntityTypeEnum = pgEnum('activity_entity_type', [
    'company',
    'contact',
    'deal',
    'interaction',
    'task',
    'pipeline',
]);

export const activityActionEnum = pgEnum('activity_action', [
    'created',
    'updated',
    'deleted',
    'restored',
    'stage_changed',
    'status_changed',
    'assigned',
    'unassigned',
    'commented',
    'mentioned',
    'email_sent',
    'email_received',
    'call_made',
    'call_received',
    'meeting_scheduled',
    'meeting_completed',
    'deal_won',
    'deal_lost',
    'task_completed',
]);

export const activity = pgTable(
    'activity',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Entity reference
        entityType: activityEntityTypeEnum('entity_type').notNull(),
        entityId: text('entity_id').notNull(),
        entityName: text('entity_name'), // Cached name for display

        // Related entities (for context)
        relatedCompanyId: text('related_company_id'),
        relatedContactId: text('related_contact_id'),
        relatedDealId: text('related_deal_id'),

        // Action details
        action: activityActionEnum('action').notNull(),
        description: text('description'), // Human-readable description

        // Change tracking
        changes: jsonb('changes').$type<{
            before?: Record<string, unknown>;
            after?: Record<string, unknown>;
            fields?: string[];
        }>(),

        // Additional context
        metadata: jsonb('metadata').$type<Record<string, unknown>>(),

        // Timestamps
        occurredAt: timestamp('occurred_at')
            .$defaultFn(() => new Date())
            .notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('activity_user_idx').on(table.userId),
        index('activity_entity_idx').on(table.entityType, table.entityId),
        index('activity_user_occurred_idx').on(table.userId, table.occurredAt),
        index('activity_company_idx').on(table.relatedCompanyId),
        index('activity_contact_idx').on(table.relatedContactId),
        index('activity_deal_idx').on(table.relatedDealId),
        index('activity_action_idx').on(table.userId, table.action),
    ],
);

export type ActivitySelect = typeof activity.$inferSelect;
export type ActivityInsert = typeof activity.$inferInsert;
export type ActivityEntityType = (typeof activityEntityTypeEnum.enumValues)[number];
export type ActivityAction = (typeof activityActionEnum.enumValues)[number];
