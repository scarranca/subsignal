import { and, eq, gte, or } from 'drizzle-orm';
import { db } from '../index';
import { billing } from '../schema/billing';
import type { BillingEntitlement, BillingInsert, BillingSelect } from '../schema/billing';
import { getBillingEntitlement } from '@/constants/pricing';

export const billingQueries = {
    /**
     * Get active billing record by user ID
     * @param userId - The ID of the user to get the active billing record for
     * @returns The active billing record for the user, or undefined if no record is found
     */
    async getBillingRecordForUser(
        userId: string,
        includeInactive: boolean = false,
    ): Promise<BillingEntitlement | undefined> {
        const result = await db.query.billing.findFirst({
            where: and(
                eq(billing.userId, userId),
                includeInactive
                    ? undefined
                    : or(eq(billing.status, 'active'), eq(billing.status, 'grace')),
            ),
        });
        if (!result) {
            return undefined;
        }

        return getBillingEntitlement(result);
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
