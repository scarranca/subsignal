import { Context, Next } from 'hono';
import { USER_BILLING_CONTEXT_KEY } from '@/constants/middleware';
import { billingQueries } from '@/db/queries';
import { getUser } from './auth';

/**
 * Check if billing is enabled
 */
const isBillingEnabled = () => process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true';

/**
 * Require billing middleware
 * Bypasses billing checks when NEXT_PUBLIC_BILLING_ENABLED is not 'true'
 * @param c - The context object
 * @param next - The next middleware function
 */
export async function requireBilling(c: Context, next: Next) {
    // Bypass billing checks when billing is disabled
    if (!isBillingEnabled()) {
        await next();
        return;
    }

    const user = getUser(c);
    const billingRecord = await billingQueries.getBillingRecordForUser(user.id);
    if (!billingRecord) {
        return c.json({ error: 'No active billing record found' }, 400);
    }

    c.set(USER_BILLING_CONTEXT_KEY, billingRecord);

    await next();
}

/**
 * Default billing plan when billing is disabled
 */
const DEFAULT_BILLING_PLAN = {
    plan: 'solo_plan_monthly',
    status: 'active',
    briefingLimit: 100,
    pageLimit: 100,
    companyLimit: 100,
};

export function getBillingPlan(c: Context) {
    // Return default plan if billing is disabled
    if (!isBillingEnabled()) {
        return DEFAULT_BILLING_PLAN;
    }

    const billingPlan = c.get(USER_BILLING_CONTEXT_KEY);
    if (!billingPlan) {
        throw new Error('Billing plan not found in context');
    }
    return billingPlan;
}
