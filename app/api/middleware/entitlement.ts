import { Context, Next } from 'hono';
import { getBillingPlan } from '@/app/api/middleware/billing';
import { getUser } from '@/app/api/middleware/auth';
import {
    PAGE_USAGE_CONTEXT_KEY,
    COMPANY_USAGE_CONTEXT_KEY,
    USER_BILLING_CONTEXT_KEY,
    REFRESH_LIMIT_CONTEXT_KEY,
    COMPANY_LIMIT_CONTEXT_KEY,
    PAGE_LIMIT_CONTEXT_KEY,
} from '@/constants/middleware';
import { getCompanyLimit, getPageLimit, getRefreshLimit } from '@/constants/pricing';
import { companyQueries, pageQueries, preferenceQueries } from '@/db/queries';

// Skip rate limiting for webhooks
const SKIP_USAGE_LIMITING_PATHS = ['/webhooks', '/inngest'];

export async function injectEntitlement(c: Context, next: Next) {
    // Only inject usage for PUT / POST / PATCH requests
    if (c.req.method !== 'PUT' && c.req.method !== 'POST' && c.req.method !== 'PATCH') {
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

    // Get the billing plan from context
    let pageLimit = getPageLimit('solo_plan'); // Assume solo plan as starters
    let companyLimit = getCompanyLimit('solo_plan'); // Assume solo plan as starters
    let refreshLimit = getRefreshLimit('solo_plan'); // Assume solo plan as starters

    // Get the billing plan from context
    const billingPlan = c.get(USER_BILLING_CONTEXT_KEY);
    if (billingPlan) {
        pageLimit = billingPlan.pageLimit;
        companyLimit = billingPlan.companyLimit;
        refreshLimit = billingPlan.refreshLimit;
    }

    // Set the page limit in context
    c.set(PAGE_LIMIT_CONTEXT_KEY, pageLimit);
    // Set the company limit in context
    c.set(COMPANY_LIMIT_CONTEXT_KEY, companyLimit);
    // Set the refresh limit in context
    c.set(REFRESH_LIMIT_CONTEXT_KEY, refreshLimit);

    await next();
}
