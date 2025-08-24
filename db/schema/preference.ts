import { pgTable, text, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const frequencyEnum = pgEnum('frequency', [
    '7_day',
    '15_day',
    '1_month',
    '3_month',
    '6_month',
]);

export const propertiesEnum = pgEnum('properties', [
    'pricing',
    'product',
    'customer',
    'partnership',
    'branding',
    'messaging',
]);

export const preference = pgTable(
    'preference',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: 'cascade' }),
        properties: text('properties').array().notNull(),
        frequency: frequencyEnum('frequency').notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('idx_preference_user_active').on(table.userId, table.isActive),
        index('idx_preference_frequency_active').on(table.frequency, table.isActive),
    ],
);
