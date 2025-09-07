import { and, eq, desc, asc, count, inArray } from 'drizzle-orm';
import { db } from '../index';
import { company } from '../schema/company';
import { page } from '../schema/page';
import type { PaginationOptions, PaginatedResult } from './types';
import { withDbTiming } from '@/lib/db-timing';
import type { Context } from 'hono';
import type { ScreenshotOptions } from '@/types/screenshot';
import type { ScreenshotOptionsInput } from '@/schema/api/page';
import { DEFAULT_PAGE_OPTIONS } from '@/constants/screenshot';

export const companyQueries = {
    /**
     * Get companies by URLs
     * @param userId - The user ID
     * @param urls - The URLs to get companies for
     * @param pageOrderBy - The order by column for the pages
     * @param context - The context
     * @returns The companies with pages
     */
    async getCompaniesByUrls(
        userId: string,
        urls: string[],
        pageOrderBy: 'asc' | 'desc' = 'asc',
        context?: Context,
    ) {
        if (urls.length === 0) return [];

        const pageOrder = pageOrderBy === 'asc' ? asc : desc;

        const companiesWithPages = await withDbTiming(
            () =>
                db.query.company.findMany({
                    where: and(
                        eq(company.userId, userId),
                        inArray(company.url, urls),
                        eq(company.isActive, true),
                    ),
                    with: {
                        pages: {
                            where: eq(page.isActive, true),
                            orderBy: [pageOrder(page.createdAt)],
                        },
                    },
                    orderBy: [desc(company.createdAt)],
                }),
            'companies-by-urls-with-pages',
            context,
            `Get companies by URLs with pages (${urls.length} URLs)`,
        );

        return companiesWithPages;
    },

    /**
     * Get companies by URLs without pages
     * @param userId - The user ID
     * @param urls - The URLs to get companies for
     * @returns The companies without pages
     */
    async getCompaniesByUrlsWithoutPages(userId: string, urls: string[]) {
        if (urls.length === 0) return [];

        const companies = await db
            .select()
            .from(company)
            .where(
                and(
                    eq(company.userId, userId),
                    inArray(company.url, urls),
                    eq(company.isActive, true),
                ),
            )
            .orderBy(desc(company.createdAt));

        return companies;
    },

    /**
     * Add a page to a company
     * @param companyId - The company ID
     * @param pageData - The page data
     * @returns The new page
     */
    async addPageToCompany(
        companyId: string,
        pageData: { title: string; url: string; options?: ScreenshotOptionsInput },
    ) {
        const [newPage] = await db
            .insert(page)
            .values({
                id: crypto.randomUUID(),
                companyId: companyId,
                title: pageData.title,
                url: pageData.url,
                options: (pageData.options || DEFAULT_PAGE_OPTIONS) as Omit<
                    ScreenshotOptions,
                    'url'
                >,
            })
            .returning();

        return newPage;
    },

    /**
     * Create a company with an initial page
     * @param userId - The user ID
     * @param data - The company data
     * @returns The company with the initial page
     */
    async createCompanyWithInitialPage(
        userId: string,
        data: {
            name: string;
            url: string;
            initialPage: {
                title: string;
                url: string;
                options?: ScreenshotOptionsInput;
            };
        },
    ) {
        return await db.transaction(async (tx) => {
            // Create the company
            const [newCompany] = await tx
                .insert(company)
                .values({
                    id: crypto.randomUUID(),
                    userId: userId,
                    name: data.name,
                    url: data.url,
                })
                .returning();

            // Create the initial page
            const [newPage] = await tx
                .insert(page)
                .values({
                    id: crypto.randomUUID(),
                    companyId: newCompany.id,
                    title: data.initialPage.title,
                    url: data.initialPage.url,
                    options: (data.initialPage.options || DEFAULT_PAGE_OPTIONS) as Omit<
                        ScreenshotOptions,
                        'url'
                    >,
                })
                .returning();

            return {
                company: newCompany,
                initialPage: newPage,
            };
        });
    },

    /**
     * Get or create a company
     * @param userId - The user ID
     * @param url - The URL to get or create the company for
     * @param name - The name of the company
     * @returns The company
     */
    async getOrCreateCompany(userId: string, url: string, name: string) {
        // First, try to find an existing company with the same URL for this user
        const existingCompany = await db.query.company.findFirst({
            where: and(
                eq(company.userId, userId),
                eq(company.url, url),
                eq(company.isActive, true),
            ),
        });

        if (existingCompany) {
            return existingCompany;
        }

        // If no existing company found, create a new one
        const [newCompany] = await db
            .insert(company)
            .values({
                id: crypto.randomUUID(),
                userId: userId,
                name: name,
                url: url,
            })
            .returning();

        return newCompany;
    },

    /**
     * Get or add pages to a company
     * @param companyId - The company ID
     * @param pages - The pages to get or add to the company
     * @returns The company with the pages
     */
    async getOrAddPagesToCompany(
        companyId: string,
        pages: { title: string; url: string; options?: ScreenshotOptionsInput }[],
    ) {
        if (pages.length === 0) {
            const companyInfo = await db.query.company.findFirst({
                where: and(eq(company.id, companyId), eq(company.isActive, true)),
                with: {
                    pages: {
                        where: eq(page.isActive, true),
                        orderBy: [page.createdAt],
                    },
                },
            });

            if (!companyInfo) {
                throw new Error('Company not found');
            }

            return {
                company: companyInfo,
                newPages: [],
                existingPages: companyInfo.pages || [],
            };
        }

        return await db.transaction(async (tx) => {
            // Verify company exists
            const companyInfo = await tx.query.company.findFirst({
                where: and(eq(company.id, companyId), eq(company.isActive, true)),
            });

            if (!companyInfo) {
                throw new Error('Company not found');
            }

            // Get existing pages for this company to check for duplicates
            const existingPages = await tx
                .select()
                .from(page)
                .where(and(eq(page.companyId, companyId), eq(page.isActive, true)));

            const existingPageUrls = new Set(existingPages.map((p) => p.url));
            const newPages: (typeof page.$inferSelect)[] = [];

            // Create pages that don't already exist
            for (const pageData of pages) {
                if (!existingPageUrls.has(pageData.url)) {
                    const [newPage] = await tx
                        .insert(page)
                        .values({
                            id: crypto.randomUUID(),
                            companyId: companyId,
                            title: pageData.title,
                            url: pageData.url,
                            options: (pageData.options || DEFAULT_PAGE_OPTIONS) as Omit<
                                ScreenshotOptions,
                                'url'
                            >,
                        })
                        .returning();

                    newPages.push(newPage);
                    existingPageUrls.add(pageData.url); // Prevent duplicates within this batch
                }
            }

            return {
                company: companyInfo,
                newPages,
                existingPages: existingPages.filter(
                    (p) => !pages.some((newP) => newP.url === p.url),
                ),
                allPages: [...existingPages, ...newPages],
            };
        });
    },

    /**
     * Get user companies with pages
     * @param userId - The user ID
     * @param options - The pagination options
     * @param context - The context
     * @returns The user companies with pages
     */
    async getUserCompaniesWithPages(
        userId: string,
        options: PaginationOptions = {},
        context?: Context,
    ): Promise<PaginatedResult<any>> {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;

        // Map sortBy to the correct orderBy function
        const getOrderBy = () => {
            const direction = sortOrder === 'asc' ? asc : desc;
            switch (sortBy) {
                case 'name':
                    return direction(company.name);
                case 'updatedAt':
                    return direction(company.updatedAt);
                default:
                    return direction(company.createdAt);
            }
        };

        // Execute both queries in parallel with timing
        const [companiesWithPages, totalCountResult] = await Promise.all([
            // Main query with relations - this replaces your N+1 problem
            withDbTiming(
                () =>
                    db.query.company.findMany({
                        where: and(eq(company.userId, userId), eq(company.isActive, true)),
                        with: {
                            pages: {
                                where: eq(page.isActive, true),
                                orderBy: [asc(page.createdAt)], // or whatever order you prefer for pages
                            },
                        },
                        orderBy: [getOrderBy()],
                        limit: pageSize,
                        offset: offset,
                    }),
                'user-companies-with-pages-data',
                context,
                `Get user companies with pages (page ${currentPage}, size ${pageSize})`,
            ),

            // Count query
            withDbTiming(
                () =>
                    db
                        .select({ count: count() })
                        .from(company)
                        .where(and(eq(company.userId, userId), eq(company.isActive, true))),
                'user-companies-with-pages-count',
                context,
                'Count total user companies with pages',
            ),
        ]);

        const totalItems = totalCountResult[0].count;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: companiesWithPages,
            pagination: {
                page: currentPage,
                pageSize,
                totalItems,
                totalPages,
                hasNext: currentPage < totalPages,
                hasPrevious: currentPage > 1,
            },
        };
    },

    /**
     * Get user companies without pages
     * @param userId - The user ID
     * @param options - The pagination options
     * @returns The user companies without pages
     */
    async getUserCompaniesWithoutPages(
        userId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<any>> {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn =
            sortBy === 'name'
                ? company.name
                : sortBy === 'updatedAt'
                  ? company.updatedAt
                  : company.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        // Get total count
        const [{ count: totalItems }] = await db
            .select({ count: count() })
            .from(company)
            .where(and(eq(company.userId, userId), eq(company.isActive, true)));

        const totalPages = Math.ceil(totalItems / pageSize);

        // Get companies
        const companies = await db
            .select({
                id: company.id,
                userId: company.userId,
                name: company.name,
                url: company.url,
                isActive: company.isActive,
                createdAt: company.createdAt,
                updatedAt: company.updatedAt,
            })
            .from(company)
            .where(and(eq(company.userId, userId), eq(company.isActive, true)))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: companies,
            pagination: {
                page: currentPage,
                pageSize,
                totalItems,
                totalPages,
                hasNext: currentPage < totalPages,
                hasPrevious: currentPage > 1,
            },
        };
    },

    /**
     * Delete a company with pages
     * @param companyId - The company ID
     * @param userId - The user ID
     * @returns The success status
     */
    async deleteCompanyWithPages(companyId: string, userId: string) {
        // Verify ownership first
        const existingCompany = await db.query.company.findFirst({
            where: eq(company.id, companyId),
        });

        if (!existingCompany || existingCompany.userId !== userId || !existingCompany.isActive) {
            throw new Error('Company not found');
        }

        // Soft delete company and all its pages in a transaction
        return await db.transaction(async (tx) => {
            // Soft delete all pages for this company
            await tx
                .update(page)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(eq(page.companyId, companyId));

            // Soft delete the company
            await tx
                .update(company)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(eq(company.id, companyId));

            return { success: true };
        });
    },

    /**
     * Get a company by ID
     * @param companyId - The company ID
     * @param userId - The user ID
     * @returns The company
     */
    async getCompanyById(companyId: string, userId: string) {
        const result = await db.query.company.findFirst({
            where: and(
                eq(company.id, companyId),
                eq(company.isActive, true),
                eq(company.userId, userId),
            ),
        });

        if (!result) {
            throw new Error('Company not found');
        }

        return result;
    },

    /**
     * Update a company
     * @param companyId - The company ID
     * @param userId - The user ID
     * @param data - The company data
     * @returns The updated company
     */
    async updateCompany(
        companyId: string,
        userId: string,
        data: {
            name?: string;
            url?: string;
        },
    ) {
        // Check if company exists and belongs to user
        const existingCompany = await db.query.company.findFirst({
            where: and(
                eq(company.id, companyId),
                eq(company.isActive, true),
                eq(company.userId, userId),
            ),
        });

        if (!existingCompany) {
            throw new Error('Company not found');
        }

        const [updatedCompany] = await db
            .update(company)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(company.id, companyId))
            .returning();

        return updatedCompany;
    },

    /**
     * Get company pages
     * @param companyId - The company ID
     * @param options - The pagination options
     * @returns The company pages
     */
    async getCompanyPages(
        companyId: string,
        options: PaginationOptions = {},
    ): Promise<{
        company: typeof company.$inferSelect | undefined;
        pages: PaginatedResult<typeof page.$inferSelect>;
    }> {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn =
            sortBy === 'title'
                ? page.title
                : sortBy === 'updatedAt'
                  ? page.updatedAt
                  : page.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        // Get company info
        const companyInfo = await db.query.company.findFirst({
            where: and(eq(company.id, companyId), eq(company.isActive, true)),
        });

        if (!companyInfo) {
            return {
                company: undefined,
                pages: {
                    data: [],
                    pagination: {
                        page: 1,
                        pageSize,
                        totalItems: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrevious: false,
                    },
                },
            };
        }

        // Get total count of pages
        const [totalResult] = await db
            .select({ count: count() })
            .from(page)
            .where(and(eq(page.companyId, companyId), eq(page.isActive, true)));

        const totalItems = totalResult.count;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated pages
        const pages = await db
            .select()
            .from(page)
            .where(and(eq(page.companyId, companyId), eq(page.isActive, true)))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            company: companyInfo,
            pages: {
                data: pages,
                pagination: {
                    page: currentPage,
                    pageSize,
                    totalItems,
                    totalPages,
                    hasNext: currentPage < totalPages,
                    hasPrevious: currentPage > 1,
                },
            },
        };
    },

    /**
     * Get active companies by user
     * @param userId - The user ID
     * @param options - The pagination options
     * @returns The active companies by user
     */
    async getActiveCompaniesByUser(
        userId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof company.$inferSelect>> {
        const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

        const offset = (page - 1) * pageSize;
        const orderByColumn =
            sortBy === 'name'
                ? company.name
                : sortBy === 'updatedAt'
                  ? company.updatedAt
                  : company.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        // Get total count
        const [totalResult] = await db
            .select({ count: count() })
            .from(company)
            .where(and(eq(company.userId, userId), eq(company.isActive, true)));

        const totalItems = totalResult.count;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated data
        const data = await db
            .select()
            .from(company)
            .where(and(eq(company.userId, userId), eq(company.isActive, true)))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    },

    /**
     * Soft delete a company
     * @param companyId - The company ID
     * @returns The success status
     */
    async softDeleteCompany(companyId: string) {
        return await db
            .update(company)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(company.id, companyId));
    },

    /**
     * Get company count by user
     * @param userId - The user ID
     * @returns The company count by user
     */
    async getCompanyCountByUser(userId: string) {
        const [totalResult] = await db
            .select({ count: count() })
            .from(company)
            .where(and(eq(company.userId, userId), eq(company.isActive, true)));

        return totalResult.count;
    },
};
