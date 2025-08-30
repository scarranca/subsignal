import { Context } from 'hono';
import { snapshotService } from '@/services/snapshot';
import {
    createSnapshotSchema,
    fetchSnapshotQuerySchema,
    listSnapshotsQuerySchema,
} from '@/schema/api';
import { z } from 'zod';
import { inngest } from '@/ingest/client';
import { pageQueries, preferenceQueries } from '@/db/queries';
import { getUser } from '@/app/api/middleware/auth';
import * as yaml from 'js-yaml';

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

        const page = await pageQueries.getPageById(validatedData.pageId, user.id);
        if (!page) {
            return c.json({ error: 'Page not found' }, 404);
        }

        if (validatedData.type === 'archive') {
            await inngest.send({
                name: 'snapshot/archive.created',
                data: {
                    pageId: page.id,
                    userId: user.id,
                    pageProperties: userPreferences.properties,
                    pageURL: page.url,
                },
            });
        } else if (validatedData.type === 'live') {
            await inngest.send({
                name: 'snapshot/live.created',
                data: {
                    pageId: validatedData.pageId,
                    userId: user.id,
                    pageProperties: userPreferences.properties,
                    pageURL: page.url,
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

        // Convert YAML diffs to JSON for prettier display
        if (result.data && Array.isArray(result.data)) {
            result.data = result.data.map((snapshot) => {
                if (snapshot.diff && typeof snapshot.diff === 'string') {
                    try {
                        // Parse YAML and convert to pretty JSON string
                        const parsedYaml = yaml.load(snapshot.diff);
                        if (parsedYaml && typeof parsedYaml === 'object') {
                            snapshot.diff = JSON.stringify(parsedYaml, null, 2);
                        }
                    } catch (error) {
                        // If YAML parsing fails, keep the original diff
                        console.warn('Failed to parse YAML diff:', error);
                    }
                }
                return snapshot;
            });
        }

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
