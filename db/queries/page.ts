import { and, eq, desc, asc, count, inArray } from 'drizzle-orm';
import { db } from '../index';
import { company } from '../schema/company';
import { page } from '../schema/page';
import type { PaginationOptions, PaginatedResult } from './types';

export const pageQueries = {
    async createPageWithExistingCompany(
        userId: string,
        data: {
            title: string;
            url: string;
            companyId: string;
        },
    ) {
        // Verify company belongs to user
        const companyExists = await db.query.company.findFirst({
            where: and(
                eq(company.id, data.companyId),
                eq(company.userId, userId),
                eq(company.isActive, true),
            ),
        });

        if (!companyExists) {
            throw new Error('Company not found');
        }

        const [newPage] = await db
            .insert(page)
            .values({
                id: crypto.randomUUID(),
                companyId: data.companyId,
                title: data.title,
                url: data.url,
            })
            .returning();

        return newPage;
    },

    async createPageWithNewCompany(
        userId: string,
        data: {
            title: string;
            url: string;
            newCompany: {
                name: string;
                url: string;
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
                })
                .returning();

            return {
                page: newPage,
                company: newCompany,
            };
        });
    },

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

    async getPaginatedPagesByCompany(
        companyId: string,
        userId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof page.$inferSelect>> {
        // Verify company belongs to user
        const companyExists = await db.query.company.findFirst({
            where: and(
                eq(company.id, companyId),
                eq(company.userId, userId),
                eq(company.isActive, true),
            ),
        });

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
        const [{ count: totalItems }] = await db
            .select({ count: count() })
            .from(page)
            .where(and(eq(page.companyId, companyId), eq(page.isActive, true)));

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

    async updatePage(
        pageId: string,
        userId: string,
        data: {
            title?: string;
            url?: string;
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
                updatedAt: new Date(),
            })
            .where(eq(page.id, pageId))
            .returning();

        return updatedPage;
    },

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

    async softDeletePage(pageId: string) {
        return await db
            .update(page)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(page.id, pageId));
    },
};
