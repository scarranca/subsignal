import { Context } from 'hono';
import { companyQueries, preferenceQueries } from '@/db/queries';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import {
    createCompanySchema,
    updateCompanySchema,
    paginationSchema,
    batchCreateCompaniesSchema,
} from '@/schema/api';
import { fetchPageTitle, generateFallbackTitle, normalizeAndDeduplicateUrls } from '@/lib/url';
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
 * Handle GET request to fetch user companies with their pages (paginated)
 */
export async function handleGetCompanies(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const excludePages = c.req.query('excludePages') === 'true';
        const pagination = paginationSchema.parse(query);

        const result = excludePages
            ? await companyQueries.getUserCompaniesWithoutPages(user.id, pagination)
            : await companyQueries.getUserCompaniesWithPages(user.id, pagination);
        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching companies:', error);
        return c.json({ error: 'Failed to fetch companies' }, 500);
    }
}

/**
 * Handle GET request to fetch a specific company
 */
export async function handleGetCompany(c: Context) {
    try {
        const user = getUser(c);
        const companyId = c.req.param('id');

        if (!companyId) {
            return c.json({ error: 'Company ID is required' }, 400);
        }

        const result = await companyQueries.getCompanyById(companyId, user.id);

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error fetching company:', error);
        return c.json({ error: 'Failed to fetch company' }, 500);
    }
}

/**
 * Handle POST request to create a new company with initial page
 */
export async function handleCreateCompany(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createCompanySchema.parse(body);

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

        // Create company with initial page
        const result = await companyQueries.createCompanyWithInitialPage(user.id, {
            name: validatedData.company.name,
            url: validatedData.company.url,
            initialPage: {
                title: pageTitle,
                url: validatedData.page.url,
            },
        });

        // Fetch the user preference
        const userPreference = await preferenceQueries.getUserPreference(user.id);

        // Send event to ingest to create archive snapshot
        await inngest.send({
            name: 'snapshot/create.archive.snapshot',
            data: {
                userId: user.id,
                pageId: result.initialPage.id,
                pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
                pageURL: validatedData.page.url,
            },
        });

        return c.json(
            {
                ...result.company,
                pages: [result.initialPage],
            },
            201,
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error creating company:', error);
        return c.json({ error: 'Failed to create company' }, 500);
    }
}

/**
 * Handle PATCH request to update a company
 */
export async function handleUpdateCompany(c: Context) {
    try {
        const user = getUser(c);
        const companyId = c.req.param('id');
        const body = await c.req.json();

        if (!companyId) {
            return c.json({ error: 'Company ID is required' }, 400);
        }

        const validatedData = updateCompanySchema.parse(body);

        const updatedCompany = await companyQueries.updateCompany(
            companyId,
            user.id,
            validatedData,
        );

        return c.json(updatedCompany);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error updating company:', error);
        return c.json({ error: 'Failed to update company' }, 500);
    }
}

/**
 * Handle DELETE request to soft delete a company and all its pages
 */
export async function handleDeleteCompany(c: Context) {
    try {
        const user = getUser(c);
        const companyId = c.req.param('id');

        if (!companyId) {
            return c.json({ error: 'Company ID is required' }, 400);
        }

        const result = await companyQueries.deleteCompanyWithPages(companyId, user.id);

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error deleting company:', error);
        return c.json({ error: 'Failed to delete company' }, 500);
    }
}

/**
 * Handle POST request to batch create companies from URLs
 */
export async function handleBatchCreateCompanies(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        console.log('API Handler - Received batch create request:', body);
        console.log('API Handler - User:', { id: user.id, email: user.email });

        const validatedData = batchCreateCompaniesSchema.parse(body);
        console.log('API Handler - Validation passed:', validatedData);

        // Step 1: Normalize casing and remove duplicates
        const normalizedUrls = normalizeAndDeduplicateUrls(validatedData.urls);
        const duplicatesRemoved = validatedData.urls.length - normalizedUrls.length;
        console.log(
            `API Handler - Normalized ${validatedData.urls.length} URLs to ${normalizedUrls.length} (removed ${duplicatesRemoved} duplicates)`,
        );

        // Step 2: Send event to ingest to batch create companies
        await inngest.send({
            name: 'onboarding/batch.create.company',
            data: {
                userId: user.id,
                urls: normalizedUrls,
            },
        });

        // Step 3: Return success response
        return c.json(
            {
                success: true,
                summary: {
                    total: validatedData.urls.length,
                    processed: normalizedUrls.length,
                    duplicatesRemoved,
                },
            },
            201,
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('API Handler - Validation error:', error.errors);
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('API Handler - Batch create error:', error);
        return c.json({ error: 'Failed to batch create companies' }, 500);
    }
}
