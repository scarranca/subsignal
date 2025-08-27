import { Context } from 'hono';
import { billingQueries } from '@/db/queries';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import { PaymentStatus } from '@/types/api';

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

        const paymentStatusResponse: PaymentStatus = {
            userName: user.name,
            userEmail: user.email,
        };

        if (!billingRecord) {
            return c.json(paymentStatusResponse);
        }

        if (billingRecord.currentPlan) {
            paymentStatusResponse.plan = billingRecord.currentPlan;
        }

        if (billingRecord.subscriptionId) {
            paymentStatusResponse.subscriptionId = billingRecord.subscriptionId;
        }

        if (billingRecord.status) {
            paymentStatusResponse.status = billingRecord.status;
        }

        return c.json(paymentStatusResponse);
    } catch (error) {
        console.error('[PAYMENT STATUS] Error fetching payment status:', error);
        return c.json({ error: 'Failed to fetch payment status' }, 500);
    }
}

/**
 * Handle GET request to validate payment status
 */
export async function handleValidatePaymentStatus(c: Context) {
    try {
        const user = getUser(c);

        // Check if the query params from the request match the billing record
        const { subscription_id } = c.req.query();

        // Get billing record
        const billingRecord = await billingQueries.getActiveBillingRecordByUserId(user.id);

        if (!billingRecord) {
            console.error('[PAYMENT STATUS] No billing record found');
            return c.json({ isValid: false }, 404);
        }

        if (subscription_id && subscription_id !== billingRecord.subscriptionId) {
            console.error(
                '[PAYMENT STATUS] Query params do not match billing record',
                subscription_id,
                billingRecord.subscriptionId,
            );
            return c.json({ isValid: false }, 400);
        }

        return c.json({ isValid: true }, 200);
    } catch {
        return c.json({ isValid: false }, 500);
    }
}
