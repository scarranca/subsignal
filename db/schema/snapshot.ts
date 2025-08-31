import { pgTable, text, timestamp, index, serial } from 'drizzle-orm/pg-core';
import { page } from './page';

export const snapshot = pgTable(
    'snapshot',
    {
        id: serial('id').primaryKey(),
        pageId: text('page_id')
            .notNull()
            .references(() => page.id, { onDelete: 'cascade' }),
        pageURL: text('page_url').notNull(),
        diff: text('diff').notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        // Optimized indexes for actual query patterns
        index('snapshot_page_url_compound_idx').on(table.pageId, table.pageURL), // Most common lookup
        index('snapshot_page_created_idx').on(table.pageId, table.createdAt), // Time-based queries
        index('snapshot_created_at_idx').on(table.createdAt), // Time-based filtering
    ],
);
