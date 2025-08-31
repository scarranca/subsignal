import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { company } from './company';

export const page = pgTable(
    'page',
    {
        id: text('id').primaryKey(),
        companyId: text('company_id')
            .notNull()
            .references(() => company.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        url: text('url').notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        // Optimized indexes for actual query patterns
        index('page_company_active_idx').on(table.companyId, table.isActive), // Most common: company's active pages
        index('page_company_active_created_idx').on(
            table.companyId,
            table.isActive,
            table.createdAt,
        ), // Paginated listings
    ],
);
