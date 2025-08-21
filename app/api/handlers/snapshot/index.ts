import { Context } from 'hono';
import { snapshotService } from '@/services/snapshot';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import {
    createSnapshotSchema,
    fetchSnapshotQuerySchema,
    listSnapshotsQuerySchema,
} from '@/schema/api';
import { z } from 'zod';
import { inngest } from '@/ingest/client';
import { preferenceQueries } from '@/db/queries';

export const getUser = (c: Context) => {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle POST request to create a snapshot for a page
 */
export async function handleCreateSnapshot(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createSnapshotSchema.parse(body);

        const userPreferences = await preferenceQueries.getUserPreference(user.id);
        if (!userPreferences) {
            return c.json({ error: 'User preferences not found' }, 404);
        }

        if (validatedData.type === 'archive') {
            await inngest.send({
                name: 'snapshot/create.archive.snapshot',
                data: {
                    pageId: validatedData.pageId,
                    userId: user.id,
                    pageProperties: userPreferences.properties,
                },
            });
        } else if (validatedData.type === 'live') {
            await inngest.send({
                name: 'snapshot/create.live.snapshot',
                data: {
                    pageId: validatedData.pageId,
                    userId: user.id,
                    pageProperties: userPreferences.properties,
                },
            });
        } else {
            return c.json({ error: 'Invalid snapshot type' }, 400);
        }

        return c.json({ message: 'Snapshot created successfully' }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Page not found') {
            return c.json({ error: 'Page not found' }, 404);
        }
        console.error('Error creating snapshot:', error);
        return c.json({ error: 'Failed to create snapshot' }, 500);
    }
}

/**
 * Handle GET request to fetch the latest snapshot for a page
 */
export async function handleGetLatestSnapshotForPage(c: Context) {
    try {
        const user = getUser(c);
        const pageId = c.req.param('pageId');
        const query = c.req.query();

        if (!pageId) {
            return c.json({ error: 'Page ID is required' }, 400);
        }

        const { content } = fetchSnapshotQuerySchema.parse(query);

        const snapshot = await snapshotService.fetchLatestSnapshotForPage(pageId, user.id, content);

        if (!snapshot) {
            return c.json({ error: 'No snapshots found for this page' }, 404);
        }

        return c.json(snapshot);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Page not found') {
            return c.json({ error: 'Page not found' }, 404);
        }
        console.error('Error fetching latest snapshot:', error);
        return c.json({ error: 'Failed to fetch latest snapshot' }, 500);
    }
}

/**
 * Handle GET request to fetch the latest snapshots for a company
 */
export async function handleGetLatestSnapshotsForCompany(c: Context) {
    try {
        const user = getUser(c);
        const companyId = c.req.param('companyId');
        const query = c.req.query();

        if (!companyId) {
            return c.json({ error: 'Company ID is required' }, 400);
        }

        const { content } = fetchSnapshotQuerySchema.parse(query);

        const snapshots = await snapshotService.fetchLatestSnapshotForCompany(
            companyId,
            user.id,
            content,
        );

        return c.json(snapshots);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error fetching latest snapshots for company:', error);
        return c.json({ error: 'Failed to fetch latest snapshots for company' }, 500);
    }
}

/**
 * Handle GET request to list snapshots for a page with pagination
 */
export async function handleListSnapshotsForPage(c: Context) {
    try {
        const user = getUser(c);
        const pageId = c.req.param('pageId');
        const query = c.req.query();

        if (!pageId) {
            return c.json({ error: 'Page ID is required' }, 400);
        }

        const { content, ...pagination } = listSnapshotsQuerySchema.parse(query);

        const result = await snapshotService.listSnapshotsForPage(
            pageId,
            user.id,
            pagination,
            content,
        );

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Page not found') {
            return c.json({ error: 'Page not found' }, 404);
        }
        console.error('Error listing snapshots for page:', error);
        return c.json({ error: 'Failed to list snapshots for page' }, 500);
    }
}
