import { Context } from 'hono';
import { activityQueries } from '@/db/queries';
import { activityFilterSchema, paginationSchema } from '@/schema/api';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';

export async function handleGetActivities(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const pagination = paginationSchema.parse(query);
        const filters = activityFilterSchema.parse(query);

        const result = await activityQueries.getUserActivities(user.id, {
            ...pagination,
            ...filters,
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching activities:', error);
        return c.json({ error: 'Failed to fetch activities' }, 500);
    }
}

export async function handleGetRecentActivities(c: Context) {
    try {
        const user = getUser(c);
        const limit = parseInt(c.req.query('limit') || '20', 10);

        const activities = await activityQueries.getRecentActivities(user.id, limit);
        return c.json({ data: activities });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        return c.json({ error: 'Failed to fetch recent activities' }, 500);
    }
}

export async function handleGetEntityActivities(c: Context) {
    try {
        const user = getUser(c);
        const entityType = c.req.param('entityType') as any;
        const entityId = c.req.param('entityId');
        const limit = parseInt(c.req.query('limit') || '50', 10);

        if (!entityType || !entityId) {
            return c.json({ error: 'Entity type and ID are required' }, 400);
        }

        const validEntityTypes = ['company', 'contact', 'deal', 'interaction', 'task', 'pipeline'];
        if (!validEntityTypes.includes(entityType)) {
            return c.json({ error: 'Invalid entity type' }, 400);
        }

        const activities = await activityQueries.getEntityActivities(user.id, entityType, entityId, limit);
        return c.json({ data: activities });
    } catch (error) {
        console.error('Error fetching entity activities:', error);
        return c.json({ error: 'Failed to fetch entity activities' }, 500);
    }
}

export async function handleGetActivityStats(c: Context) {
    try {
        const user = getUser(c);
        const days = parseInt(c.req.query('days') || '30', 10);

        const stats = await activityQueries.getActivityStats(user.id, days);
        return c.json(stats);
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        return c.json({ error: 'Failed to fetch activity stats' }, 500);
    }
}
