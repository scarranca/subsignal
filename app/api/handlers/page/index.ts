import { Context } from 'hono';
import { pageQueries, preferenceQueries } from '@/db/queries';
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
import { getUser } from '@/app/api/middleware/auth';
import { exceededCompanyLimit, exceededPageLimit } from '../../middleware/entitlement';

/**
 * Handle GET request to fetch pages by company with pagination
 */
export async function handleGetPagesByCompany(c: Context) {
    try {
        c.timing.start('auth-validation', 'User authentication and validation');
        const user = getUser(c);
        const companyId = c.req.param('companyId');
        const query = c.req.query();

        if (!companyId) {
            return c.json({ error: 'Company ID is required' }, 400);
        }
        c.timing.end('auth-validation');

        c.timing.start('input-validation', 'Query parameter validation');
        const pagination = paginationSchema.parse(query);
        c.timing.end('input-validation');

        c.timing.start('database-query', 'Fetch pages from database');
        const result = await pageQueries.getPaginatedPagesByCompany(
            companyId,
            user.id,
            pagination,
            c,
        );
        c.timing.end('database-query');

        c.timing.start('response-serialization', 'Serialize response data');
        const response = c.json(result);
        c.timing.end('response-serialization');

        return response;
    } catch (error) {
        c.timing.start('error-handling', 'Error processing and response');
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error fetching pages:', error);
        c.timing.end('error-handling');
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
        c.timing.start('auth-validation', 'User authentication and request parsing');
        const user = getUser(c);
        const body = await c.req.json();
        c.timing.end('auth-validation');

        c.timing.start('input-validation', 'Request body validation');
        const validatedData = createPageSchema.parse(body);
        c.timing.end('input-validation');

        c.timing.start('limit-checks', 'Check page and company limits');
        // Check if the user has reached the page limit
        const pageLimitExceeded = exceededPageLimit(c, 1);
        if (pageLimitExceeded) {
            return c.json(
                {
                    error: 'You have reached the maximum number of pages for your plan, please upgrade to add more pages.',
                },
                403,
            );
        }

        // Check if the user has reached the company limit if the company is new
        if (!validatedData.company.id) {
            const companyLimitExceeded = exceededCompanyLimit(c, 1);
            if (companyLimitExceeded) {
                return c.json(
                    {
                        error: 'You have reached the maximum number of companies for your plan, please upgrade to add more companies.',
                    },
                    403,
                );
            }
        }
        c.timing.end('limit-checks');

        c.timing.start('title-fetching', 'Auto-fetch page title from URL');
        // Auto-fetch page title from URL if not provided
        let pageTitle = validatedData.page.title;
        if (!pageTitle || pageTitle.trim() === '') {
            try {
                pageTitle = await fetchPageTitle(validatedData.page.url, c);
                console.log('Auto-fetched page title:', pageTitle);
            } catch (error) {
                console.error('Failed to fetch page title, using fallback:', error);
                // Use utility function for fallback title
                pageTitle = await generateFallbackTitle(validatedData.page.url);
            }
        }
        c.timing.end('title-fetching');

        c.timing.start('user-preferences', 'Fetch user preferences');
        // Fetch the user preference
        const userPreference = await preferenceQueries.getUserPreference(user.id, c);
        c.timing.end('user-preferences');

        if (validatedData.company.id) {
            c.timing.start('page-creation', 'Create page with existing company');
            // Create page with existing company
            const newPage = await pageQueries.createPageWithExistingCompany(
                user.id,
                {
                    title: pageTitle,
                    url: validatedData.page.url,
                    companyId: validatedData.company.id,
                },
                c,
            );
            c.timing.end('page-creation');

            c.timing.start('inngest-event', 'Send snapshot creation event');
            // Send event to ingest to create archive snapshot
            await inngest.send({
                name: 'snapshot/archive.created',
                data: {
                    pageId: newPage.id,
                    userId: user.id,
                    pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
                    pageURL: newPage.url,
                },
            });
            c.timing.end('inngest-event');

            return c.json(newPage, 201);
        } else {
            c.timing.start('page-company-creation', 'Create page with new company');
            // Create page with new company
            const result = await pageQueries.createPageWithNewCompany(
                user.id,
                {
                    title: pageTitle,
                    url: validatedData.page.url,
                    newCompany: {
                        name: validatedData.company.name!,
                        url: validatedData.company.url!,
                    },
                },
                c,
            );
            c.timing.end('page-company-creation');

            c.timing.start('inngest-event', 'Send snapshot creation event');
            // Send event to ingest to create archive snapshot
            await inngest.send({
                name: 'snapshot/archive.created',
                data: {
                    pageId: result.page.id,
                    userId: user.id,
                    pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
                    pageURL: result.page.url,
                },
            });
            c.timing.end('inngest-event');

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
                name: 'snapshot/archive.created',
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
