import { Context } from 'hono';
import { billingQueries } from '@/db/queries';
import { PaymentStatus } from '@/types/api';
import { getUser } from '@/app/api/middleware/auth';

/**
 * Handle GET request to get user payment status
 */
export async function handleGetPaymentStatus(c: Context) {
    try {
        const user = getUser(c);

        const billingRecord = await billingQueries.getBillingRecordForUser(user.id, c);

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
        const billingRecord = await billingQueries.getBillingRecordForUser(user.id, c);

        if (!billingRecord) {
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
