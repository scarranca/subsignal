import { pgTable, uuid, text, timestamp, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Entitlement status enum
 */
export const entitlementStatusEnum = pgEnum('entitlement_status', [
    'active', // Subscription is active - successful activation
    'failed', // Subscription is failed - failed activation
    'renewed', // Subscription is renewed - successful renewal
    'on_hold', // Subscription is on hold - failed renewal
    'cancelled', // Subscription is cancelled - successful cancellation
    'expired', // Subscription is expired - successful expiry
]);

/**
 * Plan types enum
 */
export const planEnum = pgEnum('plan', ['solo_plan', 'team_plan', 'enterprise_plan']);

/**
 * Payment provider enum for future multi-provider support
 */
export const providerEnum = pgEnum('provider', ['dodo']);

/**
 * Billing table
 */
export const billing = pgTable(
    'billing',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        // User relationship
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Entitlement status - THE source of truth for access
        status: entitlementStatusEnum('status').notNull().default('active'),

        // Current plan
        currentPlan: planEnum('current_plan'),

        // Provider info
        provider: providerEnum('provider').notNull().default('dodo'),
        subscriptionId: text('subscription_id'),
        customerId: text('customer_id'),

        // Period tracking
        // currentPeriodEnd: timestamp('current_period_end', { withTimezone: true, mode: 'date' }),

        // Timestamps
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
            .defaultNow()
            .$onUpdateFn(() => new Date())
            .notNull(),
    },
    (t) => [
        // Unique constraints
        uniqueIndex('billing_user_uidx').on(t.userId),
        uniqueIndex('billing_subscription_uidx').on(t.subscriptionId),

        // Composite indexes
        index('billing_status_plan_idx').on(t.status, t.currentPlan),
        index('billing_provider_customer_idx').on(t.provider, t.customerId),
    ],
);

export type BillingSelect = typeof billing.$inferSelect;
export type BillingInsert = typeof billing.$inferInsert;
