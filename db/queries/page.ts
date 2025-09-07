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

export const pageQueries = {
    /**
     * Create a page with an existing company
     * @param userId - The user ID
     * @param data - The page data
     * @param context - The context
     * @returns The created page
     */
    async createPageWithExistingCompany(
        userId: string,
        data: {
            title: string;
            url: string;
            companyId: string;
            options?: ScreenshotOptionsInput;
        },
        context?: Context,
    ) {
        // Verify company belongs to user
        const companyExists = await withDbTiming(
            () =>
                db.query.company.findFirst({
                    where: and(
                        eq(company.id, data.companyId),
                        eq(company.userId, userId),
                        eq(company.isActive, true),
                    ),
                }),
            'verify-company-exists',
            context,
            'Verify company ownership for page creation',
        );

        if (!companyExists) {
            throw new Error('Company not found');
        }

        const [newPage] = await withDbTiming(
            () =>
                db
                    .insert(page)
                    .values({
                        id: crypto.randomUUID(),
                        companyId: data.companyId,
                        title: data.title,
                        url: data.url,
                        options: (data.options || DEFAULT_PAGE_OPTIONS) as Omit<
                            ScreenshotOptions,
                            'url'
                        >,
                    })
                    .returning(),
            'create-page',
            context,
            'Insert new page record',
        );

        return newPage;
    },

    /**
     * Create a page with a new company
     * @param userId - The user ID
     * @param data - The page data
     * @param context - The context
     * @returns The created page
     */
    async createPageWithNewCompany(
        userId: string,
        data: {
            title: string;
            url: string;
            options?: ScreenshotOptionsInput;
            newCompany: {
                name: string;
                url: string;
            };
        },
        context?: Context,
    ) {
        return await withDbTiming(
            () =>
                db.transaction(async (tx) => {
                    // Create the company
                    const [newCompany] = await tx
                        .insert(company)
                        .values({
                            id: crypto.randomUUID(),
                            userId: userId,
                            name: data.newCompany.name,
                            url: data.newCompany.url,
                        })
                        .returning();

                    // Create the page
                    const [newPage] = await tx
                        .insert(page)
                        .values({
                            id: crypto.randomUUID(),
                            companyId: newCompany.id,
                            title: data.title,
                            url: data.url,
                            options: (data.options || DEFAULT_PAGE_OPTIONS) as Omit<
                                ScreenshotOptions,
                                'url'
                            >,
                        })
                        .returning();

                    return {
                        page: newPage,
                        company: newCompany,
                    };
                }),
            'create-page-with-company-transaction',
            context,
            'Create new company and page in transaction',
        );
    },

    /**
     * Delete a page with company cleanup
     * @param pageId - The page ID
     * @param userId - The user ID
     * @returns The result of the deletion
     */
    async deletePageWithCompanyCleanup(pageId: string, userId: string) {
        // Check if page exists and belongs to user
        const result = await db
            .select({
                page: page,
                company: {
                    id: company.id,
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(eq(page.id, pageId))
            .limit(1);

        const existingPage = result[0];

        if (
            !existingPage ||
            existingPage.company.userId !== userId ||
            !existingPage.page.isActive ||
            !existingPage.company.isActive
        ) {
            throw new Error('Page not found');
        }

        const companyId = existingPage.page.companyId;

        // Delete page and check if company should be deleted in a transaction
        return await db.transaction(async (tx) => {
            // Soft delete the page
            await tx
                .update(page)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(eq(page.id, pageId));

            // Check if company has any remaining active pages
            const [{ count: remainingPages }] = await tx
                .select({ count: count() })
                .from(page)
                .where(and(eq(page.companyId, companyId), eq(page.isActive, true)));

            let deletedCompany = false;

            // If no pages left, soft delete the company too
            if (remainingPages === 0) {
                await tx
                    .update(company)
                    .set({
                        isActive: false,
                        updatedAt: new Date(),
                    })
                    .where(eq(company.id, companyId));
                deletedCompany = true;
            }

            return {
                success: true,
                deletedCompany,
                companyId: deletedCompany ? companyId : null,
            };
        });
    },

    /**
     * Bulk delete pages with company cleanup
     * @param pageIds - The page IDs
     * @param userId - The user ID
     * @returns The result of the deletion
     */
    async bulkDeletePagesWithCompanyCleanup(pageIds: string[], userId: string) {
        // Get pages with their companies to verify ownership
        const pagesToDelete = await db
            .select({
                page: page,
                company: {
                    id: company.id,
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(and(inArray(page.id, pageIds), eq(page.isActive, true)));

        // Verify all pages belong to the user
        const unauthorizedPages = pagesToDelete.filter(
            (p) => p.company.userId !== userId || !p.company.isActive,
        );

        if (unauthorizedPages.length > 0) {
            throw new Error('Some pages not found or unauthorized');
        }

        if (pagesToDelete.length === 0) {
            throw new Error('No valid pages found to delete');
        }

        // Group pages by company for cleanup logic
        const companiesByPages = new Map<string, string[]>();
        pagesToDelete.forEach((p) => {
            const companyId = p.page.companyId;
            if (!companiesByPages.has(companyId)) {
                companiesByPages.set(companyId, []);
            }
            companiesByPages.get(companyId)!.push(p.page.id);
        });

        // Delete pages and check for empty companies in a transaction
        return await db.transaction(async (tx) => {
            // Soft delete all pages
            await tx
                .update(page)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(inArray(page.id, pageIds));

            const emptyCompanies: string[] = [];

            // Check each affected company for remaining pages
            for (const [companyId] of companiesByPages) {
                const [{ count: remainingPages }] = await tx
                    .select({ count: count() })
                    .from(page)
                    .where(and(eq(page.companyId, companyId), eq(page.isActive, true)));

                // If no pages left, soft delete the company
                if (remainingPages === 0) {
                    await tx
                        .update(company)
                        .set({
                            isActive: false,
                            updatedAt: new Date(),
                        })
                        .where(eq(company.id, companyId));

                    emptyCompanies.push(companyId);
                }
            }

            return {
                success: true,
                deletedPages: pageIds.length,
                deletedCompanies: emptyCompanies.length,
                emptyCompanies,
            };
        });
    },

    /**
     * Get paginated pages by user
     * @param userId - The user ID
     * @param options - The pagination options
     * @returns The paginated pages
     */
    async getPaginatedPagesByUser(
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
            sortBy === 'title'
                ? page.title
                : sortBy === 'updatedAt'
                  ? page.updatedAt
                  : page.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        // Get total count of pages across all user's companies
        const [{ count: totalItems }] = await db
            .select({ count: count() })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(
                and(
                    eq(company.userId, userId),
                    eq(company.isActive, true),
                    eq(page.isActive, true),
                ),
            );

        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated pages with company info
        const pagesWithCompany = await db
            .select({
                page: page,
                company: {
                    id: company.id,
                    name: company.name,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(
                and(
                    eq(company.userId, userId),
                    eq(company.isActive, true),
                    eq(page.isActive, true),
                ),
            )
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: pagesWithCompany,
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
     * Get paginated pages by company
     * @param companyId - The company ID
     * @param userId - The user ID
     * @param options - The pagination options
     * @returns The paginated pages
     */
    async getPaginatedPagesByCompany(
        companyId: string,
        userId: string,
        options: PaginationOptions = {},
        context?: Context,
    ): Promise<PaginatedResult<typeof page.$inferSelect>> {
        // Verify company belongs to user
        const companyExists = await withDbTiming(
            () =>
                db.query.company.findFirst({
                    where: and(
                        eq(company.id, companyId),
                        eq(company.userId, userId),
                        eq(company.isActive, true),
                    ),
                }),
            'verify-company-for-pages',
            context,
            'Verify company ownership for page listing',
        );

        if (!companyExists) {
            throw new Error('Company not found');
        }

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

        // Get total count
        const [{ count: totalItems }] = await withDbTiming(
            () =>
                db
                    .select({ count: count() })
                    .from(page)
                    .where(and(eq(page.companyId, companyId), eq(page.isActive, true))),
            'company-pages-count',
            context,
            'Count total pages for company',
        );

        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated pages
        const pages = await withDbTiming(
            () =>
                db
                    .select()
                    .from(page)
                    .where(and(eq(page.companyId, companyId), eq(page.isActive, true)))
                    .orderBy(orderDirection(orderByColumn))
                    .limit(pageSize)
                    .offset(offset),
            'company-pages-data',
            context,
            `Get paginated pages for company (page ${currentPage}, size ${pageSize})`,
        );

        return {
            data: pages,
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
     * Get a page by ID
     * @param pageId - The page ID
     * @param userId - The user ID
     * @returns The page
     */
    async getPageById(pageId: string, userId: string) {
        const result = await db
            .select({
                page: page,
                company: {
                    id: company.id,
                    name: company.name,
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(eq(page.id, pageId))
            .limit(1);

        const pageWithCompany = result[0];

        if (
            !pageWithCompany ||
            pageWithCompany.company.userId !== userId ||
            !pageWithCompany.page.isActive ||
            !pageWithCompany.company.isActive
        ) {
            throw new Error('Page not found');
        }

        return {
            ...pageWithCompany.page,
            company: pageWithCompany.company,
        };
    },

    /**
     * Update a page
     * @param pageId - The page ID
     * @param userId - The user ID
     * @param data - The page data
     * @returns The updated page
     */
    async updatePage(
        pageId: string,
        userId: string,
        data: {
            title?: string;
            url?: string;
            options?: ScreenshotOptionsInput;
        },
    ) {
        // Check if page exists and belongs to user
        const result = await db
            .select({
                page: page,
                company: {
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(eq(page.id, pageId))
            .limit(1);

        const existingPage = result[0];

        if (
            !existingPage ||
            existingPage.company.userId !== userId ||
            !existingPage.page.isActive ||
            !existingPage.company.isActive
        ) {
            throw new Error('Page not found');
        }

        const [updatedPage] = await db
            .update(page)
            .set({
                ...data,
                options: data.options
                    ? (data.options as Omit<ScreenshotOptions, 'url'>)
                    : undefined,
                updatedAt: new Date(),
            })
            .where(eq(page.id, pageId))
            .returning();

        return updatedPage;
    },

    /**
     * Get active pages by company
     * @param companyId - The company ID
     * @param options - The pagination options
     * @returns The active pages
     */
    async getActivePagesByCompany(
        companyId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof page.$inferSelect>> {
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

        // Get total count
        const [totalResult] = await db
            .select({ count: count() })
            .from(page)
            .where(and(eq(page.companyId, companyId), eq(page.isActive, true)));

        const totalItems = totalResult.count;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated data
        const data = await db
            .select()
            .from(page)
            .where(and(eq(page.companyId, companyId), eq(page.isActive, true)))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data,
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
     * Get active pages by user
     * @param userId - The user ID
     * @param options - The pagination options
     * @returns The active pages
     */
    async getActivePagesByUser(userId: string, options: PaginationOptions = {}) {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;

        // Get total count of pages across all user's companies
        const [totalResult] = await db
            .select({ count: count() })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(
                and(
                    eq(company.userId, userId),
                    eq(company.isActive, true),
                    eq(page.isActive, true),
                ),
            );

        const totalItems = totalResult.count;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated pages with company info
        const orderByColumn =
            sortBy === 'title'
                ? page.title
                : sortBy === 'updatedAt'
                  ? page.updatedAt
                  : page.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const pagesWithCompany = await db
            .select({
                page: page,
                company: {
                    id: company.id,
                    name: company.name,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(
                and(
                    eq(company.userId, userId),
                    eq(company.isActive, true),
                    eq(page.isActive, true),
                ),
            )
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: pagesWithCompany,
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
     * Soft delete a page
     * @param pageId - The page ID
     * @returns The result of the deletion
     */
    async softDeletePage(pageId: string) {
        return await db
            .update(page)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(page.id, pageId));
    },

    /**
     * Get page count by user
     * @param userId - The user ID
     * @returns The page count
     */
    async getPageCountByUser(userId: string) {
        const [totalResult] = await db
            .select({ count: count() })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(and(eq(company.userId, userId), eq(company.isActive, true)));

        return totalResult.count;
    },
};
