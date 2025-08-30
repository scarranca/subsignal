import { Context, Next } from 'hono';
import { getUser } from '@/app/api/middleware/auth';
import {
    PAGE_USAGE_CONTEXT_KEY,
    COMPANY_USAGE_CONTEXT_KEY,
    USER_BILLING_CONTEXT_KEY,
    REFRESH_LIMIT_CONTEXT_KEY,
    COMPANY_LIMIT_CONTEXT_KEY,
    PAGE_LIMIT_CONTEXT_KEY,
    REFRESH_USAGE_CONTEXT_KEY,
    BILLING_ENABLED_CONTEXT_KEY,
} from '@/constants/middleware';
import { getCompanyLimit, getPageLimit, getRefreshLimit } from '@/constants/pricing';
import { billingQueries, companyQueries, pageQueries, preferenceQueries } from '@/db/queries';

// Skip rate limiting for webhooks
const SKIP_USAGE_LIMITING_PATHS = ['/webhooks', '/inngest'];

/**
 * Inject limits into context
 * @param c - The context object
 * @param next - The next middleware function
 */
export async function injectLimits(c: Context, next: Next) {
    // Only inject usage for POST requests
    if (c.req.method !== 'POST' && c.req.method !== 'PUT') {
        await next();
        return;
    }

    // If the request path contains /company or /page
    const path = c.req.path;

    // Skip rate limiting for webhooks
    if (SKIP_USAGE_LIMITING_PATHS.some((skipPath) => path.includes(skipPath))) {
        await next();
        return;
    }

    // Get the billing plan from context
    let pageLimit = getPageLimit('solo_plan'); // Assume solo plan as starters
    let companyLimit = getCompanyLimit('solo_plan'); // Assume solo plan as starters
    let refreshLimit = getRefreshLimit('solo_plan'); // Assume solo plan as starters

    // Get the user from context
    const user = getUser(c);
    if (!user) {
        throw new Error('User not found in context');
    }

    // Try to get the billing plan from context
    let billingPlan = c.get(USER_BILLING_CONTEXT_KEY);

    // Incase the billing plan is not found in context
    // Lookup for a billing record for the user and set the billing plan from that
    if (!billingPlan) {
        // If the billing plan is not found, we need to look up and see if there's a billing record for the user
        billingPlan = await billingQueries.getBillingRecordForUser(user.id);
    }

    // If billing plan is available either from context or from the billing record
    // Set the limits from the billing plan
    if (billingPlan) {
        pageLimit = billingPlan.pageLimit;
        companyLimit = billingPlan.companyLimit;
        refreshLimit = billingPlan.refreshLimit;

        // Set the billing enabled flag in context
        c.set(BILLING_ENABLED_CONTEXT_KEY, true);
    }

    // Set the page limit in context
    c.set(PAGE_LIMIT_CONTEXT_KEY, pageLimit);
    // Set the company limit in context
    c.set(COMPANY_LIMIT_CONTEXT_KEY, companyLimit);
    // Set the refresh limit in context
    c.set(REFRESH_LIMIT_CONTEXT_KEY, refreshLimit);

    // Head over to the next middleware
    await next();
}

/**
 * Inject usage into context
 * @param c - The context object
 * @param next - The next middleware function
 */
export async function injectUsage(c: Context, next: Next) {
    // Only inject usage for POST requests
    if (c.req.method !== 'POST') {
        await next();
        return;
    }

    // If the request path contains /company or /page
    const path = c.req.path;

    // Skip rate limiting for webhooks
    if (SKIP_USAGE_LIMITING_PATHS.some((skipPath) => path.includes(skipPath))) {
        await next();
        return;
    }

    // Get user from context
    const user = getUser(c);

    // Get the current usage for the user
    if (path.includes('/companies') || path.includes('/pages')) {
        const companyCount = await companyQueries.getCompanyCountByUser(user.id);

        c.set(COMPANY_USAGE_CONTEXT_KEY, companyCount);

        const pageCount = await pageQueries.getPageCountByUser(user.id);

        c.set(PAGE_USAGE_CONTEXT_KEY, pageCount);
    }

    if (path.includes('/preference')) {
        const refreshCount = await preferenceQueries.getUserPreference(user.id);
        c.set(REFRESH_USAGE_CONTEXT_KEY, refreshCount);
    }

    // Head over to the next middleware
    await next();
}

/**
 * Check if the company limit is reached
 * @param c - The context object
 * @param companyAdded - The number of companies added
 * @returns
 */
export function exceededCompanyLimit(c: Context, companyAdded: number) {
    const companyLimit = c.get(COMPANY_LIMIT_CONTEXT_KEY);
    const companyUsage = c.get(COMPANY_USAGE_CONTEXT_KEY);

    if (companyLimit === undefined || companyUsage === undefined) {
        throw new Error('Company limit or company usage not found in context');
    }

    return companyUsage + companyAdded > companyLimit;
}

/**
 * Check if the page limit is reached
 * @param c - The context object
 * @param pageAdded - The number of pages added
 * @returns
 */
export function exceededPageLimit(c: Context, pageAdded: number): boolean {
    const pageLimit = c.get(PAGE_LIMIT_CONTEXT_KEY);
    const pageUsage = c.get(PAGE_USAGE_CONTEXT_KEY);

    if (pageLimit === undefined || pageUsage === undefined) {
        throw new Error('Page limit or page usage not found in context');
    }

    return pageUsage + pageAdded > pageLimit;
}

/**
 * Check if the refresh limit is reached
 * @param c - The context object
 * @param requestedRefreshPeriod - The refresh period being requested
 * @returns JSON error response if limit exceeded, undefined if allowed
 */
export function exceededRefreshLimit(c: Context, requestedRefreshPeriod: string) {
    const userPlanLimit = c.get(REFRESH_LIMIT_CONTEXT_KEY);

    if (userPlanLimit === undefined) {
        throw new Error('User plan limit not found in context');
    }

    // Convert refresh period to days for comparison
    const parseRefreshString = (refreshString: string): number => {
        switch (refreshString) {
            case '3_day':
                return 3;
            case '7_day':
                return 7;
            case '15_day':
                return 15;
            case '1_month':
                return 30;
            case '3_month':
                return 90;
            case '6_month':
                return 180;
            default:
                return 365; // effective infinity
        }
    };

    try {
        const planLimitDays = parseRefreshString(userPlanLimit);
        const requestedDays = parseRefreshString(requestedRefreshPeriod);
        return requestedDays < planLimitDays;
    } catch {
        throw new Error('Error parsing refresh periods, please contact support');
    }
}

/**
 * Check if the billing is enabled
 * @param c - The context object
 * @returns
 */
export function isBillingEnabled(c: Context) {
    const billingEnabled = c.get(BILLING_ENABLED_CONTEXT_KEY);
    // Check if billing is enabled and is true
    return billingEnabled && billingEnabled === true;
}
