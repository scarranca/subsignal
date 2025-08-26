import { and, eq, gte, or } from 'drizzle-orm';
import { db } from '../index';
import { billing } from '../schema/billing';
import type { BillingInsert, BillingSelect } from '../schema/billing';

export const billingQueries = {
    /**
     * Get billing record by user ID
     * @param userId - The ID of the user to get the billing record for
     * @returns The billing record for the user, or undefined if no record is found
     */
    async getBillingRecordByUserId(userId: string): Promise<BillingSelect | undefined> {
        return await db.query.billing.findFirst({
            where: eq(billing.userId, userId),
        });
    },

    /**
     * Get active billing record by user ID
     * @param userId - The ID of the user to get the active billing record for
     * @returns The active billing record for the user, or undefined if no record is found
     */
    async getActiveBillingRecordByUserId(userId: string): Promise<BillingSelect | undefined> {
        return await db.query.billing.findFirst({
            where: and(
                eq(billing.userId, userId),
                or(eq(billing.status, 'active'), eq(billing.status, 'renewed')),
            ),
        });
    },

    /**
     * Upsert a billing record
     * @param userId - The ID of the user to upsert the billing record for
     * @param data - The data to upsert
     * @returns The upserted billing record
     */
    async upsertBilling(
        userId: string,
        data: Omit<BillingInsert, 'userId'>,
    ): Promise<BillingSelect> {
        const [result] = await db
            .insert(billing)
            .values({
                userId,
                ...data,
            })
            .onConflictDoUpdate({
                target: billing.userId,
                set: {
                    ...data,
                    updatedAt: new Date(),
                },
            })
            .returning();
        return result;
    },
};
