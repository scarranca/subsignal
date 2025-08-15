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
    normalizeAndDeduplicateUrls,
    groupUrlsByDomain,
    extractRootDomain,
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

        // Step 1: Normalize casing and remove duplicates
        const normalizedUrls = normalizeAndDeduplicateUrls(validatedData.urls);
        const duplicatesRemoved = validatedData.urls.length - normalizedUrls.length;
        console.log(
            `API Handler - Normalized ${validatedData.urls.length} URLs to ${normalizedUrls.length} (removed ${duplicatesRemoved} duplicates)`,
        );

        // Step 2: Group URLs by root domain
        const urlsByDomain = groupUrlsByDomain(normalizedUrls);
        console.log('API Handler - Grouped URLs by domain:', Array.from(urlsByDomain.keys()));

        // Step 3: Get existing companies for all domains
        const allDomains = Array.from(urlsByDomain.keys());
        const existingCompanies = await companyQueries.getCompaniesByDomains(user.id, allDomains);

        // Create maps for quick lookup
        const existingCompaniesByDomain = new Map<string, (typeof existingCompanies)[0]>();
        const existingPageUrls = new Set<string>();

        existingCompanies.forEach((company) => {
            const domain = extractRootDomain(company.url);
            if (domain) {
                existingCompaniesByDomain.set(domain, company);
                company.pages.forEach((page) => existingPageUrls.add(page.url));
            }
        });

        const results = [];
        const errors = [];
        const logs = [];

        // Step 4: Process each domain group
        for (const [domain, domainUrls] of urlsByDomain) {
            const existingCompany = existingCompaniesByDomain.get(domain);

            if (!existingCompany) {
                // No existing company for this domain - create new company with first URL
                const primaryUrl = domainUrls[0];

                try {
                    const companyName = await extractCompanyName(primaryUrl);
                    const companyUrl = extractBaseUrl(primaryUrl);
                    const pageTitle = await fetchPageTitle(primaryUrl);

                    const result = await companyQueries.createCompanyWithInitialPage(user.id, {
                        name: companyName,
                        url: companyUrl,
                        initialPage: {
                            title: pageTitle,
                            url: primaryUrl,
                        },
                    });

                    results.push({
                        url: primaryUrl,
                        success: true,
                        company: result.company,
                        page: result.initialPage,
                        action: 'company_created',
                    });

                    logs.push(
                        `Created new company "${companyName}" for domain ${domain} with page ${primaryUrl}`,
                    );

                    // Add additional pages for this company
                    for (const url of domainUrls.slice(1)) {
                        try {
                            const pageTitle = await fetchPageTitle(url);
                            const newPage = await companyQueries.addPageToCompany(
                                result.company.id,
                                {
                                    title: pageTitle,
                                    url: url,
                                },
                            );

                            results.push({
                                url: url,
                                success: true,
                                company: result.company,
                                page: newPage,
                                action: 'page_added',
                            });

                            logs.push(`Added page ${url} to company "${companyName}"`);
                        } catch (error) {
                            console.error(`Error adding page ${url} to company:`, error);
                            errors.push({
                                url: url,
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown error',
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error creating company for domain ${domain}:`, error);
                    errors.push({
                        url: primaryUrl,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            } else {
                // Company exists - add new pages that don't already exist
                for (const url of domainUrls) {
                    if (existingPageUrls.has(url)) {
                        // Page already exists - silently skip with log
                        results.push({
                            url: url,
                            success: true,
                            company: existingCompany,
                            page: existingCompany.pages.find((p) => p.url === url) || null,
                            action: 'page_exists',
                        });
                        logs.push(
                            `Page ${url} already exists for company "${existingCompany.name}"`,
                        );
                    } else {
                        // Add new page to existing company
                        try {
                            const pageTitle = await fetchPageTitle(url);
                            const newPage = await companyQueries.addPageToCompany(
                                existingCompany.id,
                                {
                                    title: pageTitle,
                                    url: url,
                                },
                            );

                            results.push({
                                url: url,
                                success: true,
                                company: existingCompany,
                                page: newPage,
                                action: 'page_added',
                            });

                            logs.push(
                                `Added new page ${url} to existing company "${existingCompany.name}"`,
                            );
                        } catch (error) {
                            console.error(`Error adding page ${url} to existing company:`, error);
                            errors.push({
                                url: url,
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown error',
                            });
                        }
                    }
                }
            }
        }

        // Log summary
        console.log('API Handler - Processing summary:', {
            totalOriginalUrls: validatedData.urls.length,
            normalizedUrls: normalizedUrls.length,
            duplicatesRemoved,
            domainsProcessed: urlsByDomain.size,
            results: results.length,
            errors: errors.length,
        });

        logs.forEach((log) => console.log(`API Handler - ${log}`));

        return c.json(
            {
                success: true,
                results: results,
                errors: errors,
                logs: logs,
                summary: {
                    total: validatedData.urls.length,
                    processed: normalizedUrls.length,
                    duplicatesRemoved,
                    successful: results.length,
                    failed: errors.length,
                    companiesCreated: results.filter((r) => r.action === 'company_created').length,
                    pagesAdded: results.filter((r) => r.action === 'page_added').length,
                    pagesExisted: results.filter((r) => r.action === 'page_exists').length,
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
