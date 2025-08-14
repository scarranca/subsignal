import { Context } from 'hono';
import { companyQueries } from '@/db/queries';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import {
    createCompanySchema,
    updateCompanySchema,
    paginationSchema,
    batchCreateCompaniesSchema,
} from '@/schema/api';
import { extractCompanyName, extractBaseUrl, fetchPageTitle } from '@/lib/url-utils';
import { z } from 'zod';

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

        const pagination = paginationSchema.parse(query);

        const result = await companyQueries.getUserCompaniesWithPages(user.id, pagination);

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

        const result = await companyQueries.createCompanyWithInitialPage(user.id, {
            name: validatedData.company.name,
            url: validatedData.company.url,
            initialPage: {
                title: validatedData.page.title,
                url: validatedData.page.url,
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

        const validatedData = batchCreateCompaniesSchema.parse(body);

        const results = [];
        const errors = [];

        // Process each URL
        for (const url of validatedData.urls) {
            try {
                // Extract company information
                const companyName = extractCompanyName(url);
                const companyUrl = extractBaseUrl(url);

                // Fetch page title
                const pageTitle = await fetchPageTitle(url);

                // Create company with initial page
                const result = await companyQueries.createCompanyWithInitialPage(user.id, {
                    name: companyName,
                    url: companyUrl,
                    initialPage: {
                        title: pageTitle,
                        url: url,
                    },
                });

                results.push({
                    url: url,
                    success: true,
                    company: result.company,
                    page: result.initialPage,
                });
            } catch (error) {
                console.error(`Error processing URL ${url}:`, error);
                errors.push({
                    url: url,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return c.json(
            {
                success: true,
                results: results,
                errors: errors,
                summary: {
                    total: validatedData.urls.length,
                    successful: results.length,
                    failed: errors.length,
                },
            },
            201,
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error batch creating companies:', error);
        return c.json({ error: 'Failed to batch create companies' }, 500);
    }
}
