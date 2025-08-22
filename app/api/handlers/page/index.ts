import { Context } from 'hono';
import { pageQueries, preferenceQueries } from '@/db/queries';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import {
    createPageSchema,
    updatePageSchema,
    paginationSchema,
    bulkDeletePagesSchema,
} from '@/schema/api';
import { fetchPageTitle, generateFallbackTitle } from '@/lib/url';
import { z } from 'zod';
import { inngest } from '@/ingest/client';
import { DEFAULT_PREFERENCES } from '@/constants/preferences';

export const getUser = (c: Context) => {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to fetch pages by company with pagination
 */
export async function handleGetPagesByCompany(c: Context) {
    try {
        const user = getUser(c);
        const companyId = c.req.param('companyId');
        const query = c.req.query();

        if (!companyId) {
            return c.json({ error: 'Company ID is required' }, 400);
        }

        const pagination = paginationSchema.parse(query);

        const result = await pageQueries.getPaginatedPagesByCompany(companyId, user.id, pagination);

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error fetching pages:', error);
        return c.json({ error: 'Failed to fetch pages' }, 500);
    }
}

/**
 * Handle GET request to fetch all pages for user with pagination
 */
export async function handleGetPagesByUser(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const pagination = paginationSchema.parse(query);

        const result = await pageQueries.getPaginatedPagesByUser(user.id, pagination);

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching pages:', error);
        return c.json({ error: 'Failed to fetch pages' }, 500);
    }
}

/**
 * Handle GET request to fetch a specific page
 */
export async function handleGetPage(c: Context) {
    try {
        const user = getUser(c);
        const pageId = c.req.param('id');

        if (!pageId) {
            return c.json({ error: 'Page ID is required' }, 400);
        }

        const result = await pageQueries.getPageById(pageId, user.id);

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Page not found') {
            return c.json({ error: 'Page not found' }, 404);
        }
        console.error('Error fetching page:', error);
        return c.json({ error: 'Failed to fetch page' }, 500);
    }
}

/**
 * Handle POST request to create a new page (with existing or new company)
 */
export async function handleCreatePage(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createPageSchema.parse(body);

        // Auto-fetch page title from URL if not provided
        let pageTitle = validatedData.page.title;
        if (!pageTitle || pageTitle.trim() === '') {
            try {
                pageTitle = await fetchPageTitle(validatedData.page.url);
                console.log('Auto-fetched page title:', pageTitle);
            } catch (error) {
                console.error('Failed to fetch page title, using fallback:', error);
                // Use utility function for fallback title
                pageTitle = await generateFallbackTitle(validatedData.page.url);
            }
        }

        // Fetch the user preference
        const userPreference = await preferenceQueries.getUserPreference(user.id);

        if (validatedData.company.id) {
            // Create page with existing company
            const newPage = await pageQueries.createPageWithExistingCompany(user.id, {
                title: pageTitle,
                url: validatedData.page.url,
                companyId: validatedData.company.id,
            });

            // Send event to ingest to create archive snapshot
            await inngest.send({
                name: 'snapshot/create.archive.snapshot',
                data: {
                    pageId: newPage.id,
                    userId: user.id,
                    pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
                    pageURL: newPage.url,
                },
            });

            return c.json(newPage, 201);
        } else {
            // Create page with new company
            const result = await pageQueries.createPageWithNewCompany(user.id, {
                title: pageTitle,
                url: validatedData.page.url,
                newCompany: {
                    name: validatedData.company.name!,
                    url: validatedData.company.url!,
                },
            });

            // Send event to ingest to create archive snapshot
            await inngest.send({
                name: 'snapshot/create.archive.snapshot',
                data: {
                    pageId: result.page.id,
                    userId: user.id,
                    pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
                    pageURL: result.page.url,
                },
            });

            return c.json(
                {
                    page: result.page,
                    company: result.company,
                },
                201,
            );
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error creating page:', error);
        return c.json({ error: 'Failed to create page' }, 500);
    }
}

/**
 * Handle PATCH request to update a page
 */
export async function handleUpdatePage(c: Context) {
    try {
        const user = getUser(c);
        const pageId = c.req.param('id');
        const body = await c.req.json();

        if (!pageId) {
            return c.json({ error: 'Page ID is required' }, 400);
        }

        const validatedData = updatePageSchema.parse(body);

        const updatedPage = await pageQueries.updatePage(pageId, user.id, validatedData);

        // Fetch the user preference
        const userPreference = await preferenceQueries.getUserPreference(user.id);

        // If the page url is updated, we need to create a new archive snapshot
        if (validatedData.url) {
            await inngest.send({
                name: 'snapshot/create.archive.snapshot',
                data: {
                    pageId: updatedPage.id,
                    userId: user.id,
                    pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
                    pageURL: updatedPage.url,
                },
            });
        }

        return c.json(updatedPage);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Page not found') {
            return c.json({ error: 'Page not found' }, 404);
        }
        console.error('Error updating page:', error);
        return c.json({ error: 'Failed to update page' }, 500);
    }
}

/**
 * Handle POST request to bulk delete pages and cleanup empty companies
 */
export async function handleBulkDeletePages(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const { pageIds } = bulkDeletePagesSchema.parse(body);

        const result = await pageQueries.bulkDeletePagesWithCompanyCleanup(pageIds, user.id);

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (
            error instanceof Error &&
            (error.message === 'Some pages not found or unauthorized' ||
                error.message === 'No valid pages found to delete')
        ) {
            return c.json({ error: error.message }, 404);
        }
        console.error('Error bulk deleting pages:', error);
        return c.json({ error: 'Failed to bulk delete pages' }, 500);
    }
}
