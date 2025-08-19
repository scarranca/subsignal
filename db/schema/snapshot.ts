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
        index('snapshot_page_id_idx').on(table.pageId),
        index('snapshot_created_at_idx').on(table.createdAt),
        index('snapshot_page_created_idx').on(table.pageId, table.createdAt),
        index('snapshot_page_url_idx').on(table.pageURL),
    ],
);
