import { Context } from 'hono';
import { companyQueries } from '@/db/queries';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import {
    createCompanySchema,
    updateCompanySchema,
    paginationSchema,
    batchCreateCompaniesSchema,
} from '@/schema/api';
import {
    extractCompanyName,
    extractBaseUrl,
    fetchPageTitle,
    generateFallbackTitle,
} from '@/lib/url';
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

        const result = await companyQueries.createCompanyWithInitialPage(user.id, {
            name: validatedData.company.name,
            url: validatedData.company.url,
            initialPage: {
                title: pageTitle,
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

        console.log('API Handler - Received batch create request:', body);
        console.log('API Handler - User:', { id: user.id, email: user.email });

        const validatedData = batchCreateCompaniesSchema.parse(body);
        console.log('API Handler - Validation passed:', validatedData);

        // Check for existing companies to avoid duplicates
        const existingCompanies = await companyQueries.getCompaniesByUrls(
            user.id,
            validatedData.urls,
        );
        const existingUrls = new Set(existingCompanies.map((company) => company.url));
        console.log('API Handler - Found existing URLs:', Array.from(existingUrls));

        // Filter out URLs that already exist
        const urlsToCreate = validatedData.urls.filter((url) => !existingUrls.has(url));
        console.log('API Handler - URLs to create:', urlsToCreate);

        const results = [];
        const errors = [];

        // Add existing companies to results as successful (silently skip creation)
        existingCompanies.forEach((company) => {
            results.push({
                url: company.url,
                success: true,
                company: company,
                page: company.pages?.[0] || null, // Include first page if available
                skipped: true, // Flag to indicate this was skipped
            });
        });

        // Process each new URL (URLs are already normalized by schema)
        for (const url of urlsToCreate) {
            try {
                // Extract company information
                const companyName = await extractCompanyName(url);
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
                    skipped: false, // Flag to indicate this was newly created
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
                    created: results.filter((r) => !r.skipped).length,
                    skipped: results.filter((r) => r.skipped).length,
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
