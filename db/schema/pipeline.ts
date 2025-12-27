import { pgTable, text, timestamp, boolean, integer, index, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { organization } from './organization';

export const defaultPipelineStages = [
    { name: 'Lead', color: '#6B7280', probability: 10 },
    { name: 'Qualified', color: '#3B82F6', probability: 25 },
    { name: 'Proposal', color: '#8B5CF6', probability: 50 },
    { name: 'Negotiation', color: '#F59E0B', probability: 75 },
    { name: 'Closed Won', color: '#10B981', probability: 100 },
    { name: 'Closed Lost', color: '#EF4444', probability: 0 },
] as const;

export const pipeline = pgTable(
    'pipeline',
    {
        id: text('id').primaryKey(),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        description: text('description'),
        isDefault: boolean('is_default').default(false).notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('pipeline_org_idx').on(table.organizationId),
        index('pipeline_org_default_idx').on(table.organizationId, table.isDefault),
    ],
);

export const pipelineStage = pgTable(
    'pipeline_stage',
    {
        id: text('id').primaryKey(),
        pipelineId: text('pipeline_id')
            .notNull()
            .references(() => pipeline.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        color: text('color').default('#6B7280').notNull(),
        probability: integer('probability').default(0).notNull(), // 0-100
        position: integer('position').notNull(),
        isWonStage: boolean('is_won_stage').default(false).notNull(),
        isLostStage: boolean('is_lost_stage').default(false).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('pipeline_stage_pipeline_idx').on(table.pipelineId),
        index('pipeline_stage_position_idx').on(table.pipelineId, table.position),
    ],
);

export type PipelineSelect = typeof pipeline.$inferSelect;
export type PipelineInsert = typeof pipeline.$inferInsert;
export type PipelineStageSelect = typeof pipelineStage.$inferSelect;
export type PipelineStageInsert = typeof pipelineStage.$inferInsert;
