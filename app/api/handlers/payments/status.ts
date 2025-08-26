import { Context } from 'hono';
import { billingQueries } from '@/db/queries';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';

export const getUser = (c: Context) => {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to get user payment status
 */
export async function handleGetPaymentStatus(c: Context) {
    try {
        const user = getUser(c);

        const billingRecord = await billingQueries.getActiveBillingRecordByUserId(user.id);

        if (!billingRecord) {
            const noBillingResponse = {
                isPaying: false,
                currentPlan: null,
                userName: user.name,
                userEmail: user.email,
            };
            return c.json(noBillingResponse);
        }

        const response = {
            isPaying: billingRecord.status === 'active' || billingRecord.status === 'renewed',
            currentPlan: billingRecord.currentPlan,
            userName: user.name,
            userEmail: user.email,
        };

        return c.json(response);
    } catch (error) {
        console.error('[PAYMENT STATUS] Error fetching payment status:', error);
        return c.json({ error: 'Failed to fetch payment status' }, 500);
    }
}
