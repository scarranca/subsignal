import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const company = pgTable(
    'company',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
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
        index('company_user_active_idx').on(table.userId, table.isActive), // Most common: user's active companies
        index('company_user_active_id_idx').on(table.userId, table.isActive, table.id), // Company lookups with ownership
        index('company_url_user_idx').on(table.url, table.userId), // Batch operations by URL
    ],
);
