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
        index('page_company_id_idx').on(table.companyId),
        index('page_active_idx').on(table.isActive, table.companyId),
        index('page_title_idx').on(table.title),
        index('page_url_idx').on(table.url),
    ],
);
