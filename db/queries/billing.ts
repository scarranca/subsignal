import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { billing } from '../schema/billing';
import type { BillingEntitlement, BillingInsert, BillingSelect } from '../schema/billing';
import { getBillingEntitlement } from '@/constants/pricing';
import { withDbTiming } from '@/lib/db-timing';
import type { Context } from 'hono';

export const billingQueries = {
    /**
     * Get active billing record by user ID
     * @param userId - The ID of the user to get the active billing record for
     * @returns The active billing record for the user, or undefined if no record is found
     */
    async getBillingRecordForUser(
        userId: string,
        context?: Context,
    ): Promise<BillingEntitlement | undefined> {
        const result = await withDbTiming(
            () =>
                db.query.billing.findFirst({
                    where: and(eq(billing.userId, userId), eq(billing.status, 'active')),
                }),
            'billing-record-for-user',
            context,
            'Get active billing record for user',
        );

        if (!result) {
            return undefined;
        }

        return getBillingEntitlement(result);
    },

    /**
     * Activate a subscription for a user
     * @param userId - The ID of the user to activate the subscription for
     * @param data - The data to activate the subscription
     * @returns True if a new record was created, false if an existing record was updated, and the billing record that was created
     */
    async activateSubscription(
        userId: string,
        data: Omit<BillingInsert, 'userId' | 'productId' | 'subscriptionId' | 'provider'> & {
            productId: string;
            subscriptionId: string;
            customerId: string;
            provider?: 'dodo';
        },
    ): Promise<{
        createdSubscription: boolean;
        updatedSubscription: boolean;
        renewedSubscription: boolean;
        billingRecord: BillingSelect;
    }> {
        // First, check if there's an existing record for this user
        const existingRecord = await db.query.billing.findFirst({
            where: eq(billing.userId, userId),
        });

        // Create the data to insert
        const insertData: BillingInsert = {
            userId,
            productId: data.productId,
            subscriptionId: data.subscriptionId,
            customerId: data.customerId,
            provider: data.provider || 'dodo',
            currentPlan: data.currentPlan,
            status: 'active',
            webhookEvent: data.webhookEvent,
        };

        // If no existing record, create a new one and return the new record
        if (!existingRecord) {
            const [newRecord] = await db.insert(billing).values(insertData).returning();
            return {
                createdSubscription: true,
                updatedSubscription: false,
                renewedSubscription: false,
                billingRecord: newRecord,
            };
        }

        // Check if we need to update based on the conditions:
        // Update when productId, customerId, provider, or subscriptionId are different
        // Otherwise, return the existing record
        const needsUpdate =
            existingRecord.productId !== data.productId ||
            existingRecord.customerId !== data.customerId ||
            existingRecord.provider !== (data.provider || 'dodo') ||
            existingRecord.subscriptionId !== data.subscriptionId;

        if (needsUpdate) {
            // Update existing record
            const [updatedRecord] = await db
                .update(billing)
                .set({
                    ...insertData,
                    updatedAt: new Date(),
                })
                .where(eq(billing.userId, userId))
                .returning();

            return {
                createdSubscription: false,
                updatedSubscription: true,
                renewedSubscription: false,
                billingRecord: updatedRecord,
            };
        }

        // If no update needed, return the existing record
        return {
            createdSubscription: false,
            updatedSubscription: false,
            renewedSubscription: true,
            billingRecord: existingRecord,
        };
    },

    /**
     * Deactivate a subscription
     * @param userId - The ID of the user to deactivate the subscription for
     * @param data - The data to deactivate the subscription
     * @returns True if the subscription was deactivated, false if it was not
     */
    async deactivateSubscription(
        userId: string,
        data: {
            subscriptionId: string;
            customerId: string;
            provider: 'dodo';
            webhookEvent: string;
        },
    ): Promise<{ deactivated: boolean }> {
        // Find the existing record for this user
        const existingRecord = await db.query.billing.findFirst({
            where: eq(billing.userId, userId),
        });

        // If no existing record, nothing to deactivate
        if (!existingRecord) {
            return { deactivated: false };
        }

        // Check if the existing record matches the provided data
        const isMatchingRecord =
            existingRecord.customerId === data.customerId &&
            existingRecord.provider === (data.provider || 'dodo') &&
            existingRecord.subscriptionId === data.subscriptionId;

        // Only deactivate if it's a matching record and currently active
        if (isMatchingRecord && existingRecord.status === 'active') {
            await db
                .update(billing)
                .set({
                    status: 'inactive',
                    webhookEvent: data.webhookEvent,
                    updatedAt: new Date(),
                })
                .where(eq(billing.userId, userId));

            return { deactivated: true };
        }

        return { deactivated: false };
    },
};
