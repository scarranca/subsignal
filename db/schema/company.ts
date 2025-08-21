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
        index('company_user_id_idx').on(table.userId),
        index('company_active_idx').on(table.isActive, table.userId),
        index('company_name_idx').on(table.name),
        index('company_url_idx').on(table.url),
    ],
);
