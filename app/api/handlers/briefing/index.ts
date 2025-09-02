import { Context } from 'hono';
import { briefingService } from '@/services/briefing';
import { getUser } from '../../middleware/auth';
import { paginationSchema } from '@/schema/api';
import { z } from 'zod';
import { getBillingPlan } from '../../middleware/billing';
import { getBriefingLimit } from '@/constants/pricing';

export async function handleGetBriefingsForUser(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        // Parse pagination parameters for company listing
        const companyPagination = paginationSchema.parse({
            ...query,
            sortBy: 'createdAt',
            sortOrder: 'asc',
        });

        // Get billing plan from context
        const billingPlan = getBillingPlan(c);
        const briefingLimit = billingPlan.briefingLimit ?? getBriefingLimit('solo_plan_monthly');

        const briefings = await briefingService.getBriefingsForUser(
            user.id,
            'url',
            companyPagination,
            {
                page: 1,
                pageSize: briefingLimit,
            },
        );

        return c.json({
            success: true,
            data: briefings.data,
            pagination: briefings.pagination,
            errors: briefings.errors,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching briefings:', error);
        return c.json({ error: 'Failed to fetch briefings' }, 500);
    }
}
