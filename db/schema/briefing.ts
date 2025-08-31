import { pgTable, text, timestamp, index, serial } from 'drizzle-orm/pg-core';
import { company } from './company';

export const briefing = pgTable(
    'briefing',
    {
        id: serial('id').primaryKey(),
        companyId: text('company_id')
            .notNull()
            .references(() => company.id, { onDelete: 'cascade' }),
        companyUrl: text('company_url').notNull(),
        briefing: text('briefing').notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        // Optimized indexes for actual query patterns
        index('briefing_company_created_idx').on(table.companyId, table.createdAt), // Most common: time-ordered company briefings
        index('briefing_created_at_idx').on(table.createdAt), // Global time-based queries
    ],
);
