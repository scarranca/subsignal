import { Context, Next } from 'hono';
import { USER_BILLING_CONTEXT_KEY } from '@/constants/middleware';
import { billingQueries } from '@/db/queries';
import { getUser } from './auth';

/**
 * Require billing middleware
 * @param c - The context object
 * @param next - The next middleware function
 */
export async function requireBilling(c: Context, next: Next) {
    const user = getUser(c);
    const billingRecord = await billingQueries.getBillingRecordForUser(user.id);
    if (!billingRecord) {
        return c.json({ error: 'No active billing record found' }, 400);
    }

    c.set(USER_BILLING_CONTEXT_KEY, billingRecord);

    await next();
}

export function getBillingPlan(c: Context) {
    const billingPlan = c.get(USER_BILLING_CONTEXT_KEY);
    if (!billingPlan) {
        throw new Error('Billing plan not found in context');
    }
    return billingPlan;
}
