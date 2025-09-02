import { pgTable, uuid, text, timestamp, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Entitlement status enum
 */
export const entitlementStatusEnum = pgEnum('entitlement_status', [
    'active', // Entitlements are in full effect
    'inactive', // Entitlements are not in effect
]);

/**
 * Plan types enum
 */
export const planEnum = pgEnum('plan', [
    'solo_plan_monthly',
    'team_plan_monthly',
    'solo_plan_annually',
    'team_plan_annually',
    'custom_plan',
]);

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

        // Entitlement info
        status: entitlementStatusEnum('status').notNull().default('active'), // Current entitlement status
        currentPlan: planEnum('current_plan'), // Current entitlement plan

        // Subscription info
        subscriptionId: text('subscription_id'), // Internal dodopayments subscription id
        productId: text('product_id'), // Internal dodopayments product id
        customerId: text('customer_id'), // Internal dodopayments customer id

        // Provider info
        provider: providerEnum('provider').notNull().default('dodo'),
        webhookEvent: text('webhook_event'),

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

        // Optimized composite indexes for actual query patterns
        index('billing_user_status_idx').on(t.userId, t.status), // Most common: getUserRecord + status
        index('billing_provider_customer_idx').on(t.provider, t.customerId),
    ],
);

export type BillingSelect = typeof billing.$inferSelect;
export type BillingInsert = typeof billing.$inferInsert;

export type BillingPlan = (typeof planEnum.enumValues)[number];
export type BillingEntitlementStatus = (typeof entitlementStatusEnum.enumValues)[number];

export type BillingEntitlement = BillingSelect & {
    status: BillingEntitlementStatus; // Current status
    currentPlan: BillingPlan; // Current plan
    pageLimit: number; // Maximum number of pages
    companyLimit: number; // Maximum number of companies
    briefingLimit: number; // Maximum number of briefings
    refreshLimit: '3_day' | '7_day'; // Highest supported refresh frequency
    zapierEnabled: boolean; // Whether zapier is enabled
    emailEnabled: boolean; // Whether email is enabled
};

export type BillingProvider = (typeof providerEnum.enumValues)[number];

/**
 * Available plans that can be purchased (excluding custom plans)
 */
export type AvailableBillingPlan = Exclude<BillingPlan, 'custom_plan'>;
