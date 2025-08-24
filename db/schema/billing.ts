import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const billing = pgTable('billing', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    currentPlan: text('current_plan'), // 'solo' | 'team' | null
    isPaying: boolean('is_paying').default(false),
    createdAt: timestamp('created_at')
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp('updated_at')
        .$defaultFn(() => new Date())
        .notNull(),
});

export type BillingInsert = typeof billing.$inferInsert;
export type BillingSelect = typeof billing.$inferSelect;
