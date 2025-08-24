import { eq } from 'drizzle-orm';
import { db } from '../index';
import { billing } from '../schema/billing';
import { user } from '../schema/auth';
import type { BillingInsert, BillingSelect } from '../schema/billing';

export const billingQueries = {
    async getBillingByUserId(userId: string): Promise<BillingSelect | undefined> {
        return await db.query.billing.findFirst({
            where: eq(billing.userId, userId),
        });
    },

    async getUserWithBilling(userId: string) {
        return await db.query.user.findFirst({
            where: eq(user.id, userId),
            with: {
                billing: true,
            },
        });
    },

    async getBillingByUserEmail(email: string): Promise<BillingSelect | undefined> {
        const userRecord = await db.query.user.findFirst({
            where: eq(user.email, email),
            with: {
                billing: true,
            },
        });
        return userRecord?.billing;
    },

    async createBilling(data: BillingInsert): Promise<BillingSelect> {
        const [inserted] = await db.insert(billing).values(data).returning();
        return inserted;
    },

    async updateBillingByUserId(
        userId: string,
        data: Partial<Omit<BillingInsert, 'userId'>>,
    ): Promise<BillingSelect | undefined> {
        const [updated] = await db
            .update(billing)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(billing.userId, userId))
            .returning();
        return updated;
    },

    async upsertBilling(
        userId: string,
        data: Omit<BillingInsert, 'userId'>,
    ): Promise<BillingSelect> {
        const existing = await this.getBillingByUserId(userId);

        if (existing) {
            const updated = await this.updateBillingByUserId(userId, data);
            return updated!;
        } else {
            return await this.createBilling({ ...data, userId });
        }
    },

    async deleteBilling(userId: string): Promise<boolean> {
        const result = await db.delete(billing).where(eq(billing.userId, userId)).returning();
        return result.length > 0;
    },

    async getPayingUsers(): Promise<BillingSelect[]> {
        return await db.select().from(billing).where(eq(billing.isPaying, true));
    },

    async getUsersByPlan(plan: string): Promise<BillingSelect[]> {
        return await db.select().from(billing).where(eq(billing.currentPlan, plan));
    },
};
