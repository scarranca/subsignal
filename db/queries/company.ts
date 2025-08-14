import { and, eq, desc, asc, count } from 'drizzle-orm';
import { db } from '../index';
import { user } from '../schema/auth';
import { company } from '../schema/company';
import { page } from '../schema/page';
import type { PaginationOptions, PaginatedResult } from './types';

export const companyQueries = {
    async createCompanyWithInitialPage(userId: string, data: {
        name: string;
        url: string;
        initialPage: {
            title: string;
            url: string;
        };
    }) {
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
                })
                .returning();

            return {
                company: newCompany,
                initialPage: newPage,
            };
        });
    },

    async getUserCompaniesWithPages(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
        const { 
            page: currentPage = 1, 
            pageSize = 10, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn = sortBy === 'name' ? company.name : 
                             sortBy === 'updatedAt' ? company.updatedAt : 
                             company.createdAt;
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

        // Get pages for each company
        const companiesWithPages = await Promise.all(
            companies.map(async (comp) => {
                const pages = await db
                    .select()
                    .from(page)
                    .where(and(eq(page.companyId, comp.id), eq(page.isActive, true)))
                    .orderBy(page.createdAt);

                return {
                    ...comp,
                    pages,
                };
            })
        );

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
                    updatedAt: new Date() 
                })
                .where(eq(page.companyId, companyId));

            // Soft delete the company
            await tx
                .update(company)
                .set({ 
                    isActive: false, 
                    updatedAt: new Date() 
                })
                .where(eq(company.id, companyId));

            return { success: true };
        });
    },

    async getCompanyById(companyId: string, userId: string) {
        const result = await db.query.company.findFirst({
            where: eq(company.id, companyId),
            with: {
                user: {
                    columns: { id: true, name: true }
                }
            }
        });

        if (!result || result.userId !== userId || !result.isActive) {
            throw new Error('Company not found');
        }

        return result;
    },

    async updateCompany(companyId: string, userId: string, data: {
        name?: string;
        url?: string;
    }) {
        // Check if company exists and belongs to user
        const existingCompany = await db.query.company.findFirst({
            where: eq(company.id, companyId),
        });

        if (!existingCompany || existingCompany.userId !== userId || !existingCompany.isActive) {
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

    async getCompanyPages(companyId: string, options: PaginationOptions = {}): Promise<{ 
        company: typeof company.$inferSelect | undefined;
        pages: PaginatedResult<typeof page.$inferSelect>;
    }> {
        const { 
            page: currentPage = 1, 
            pageSize = 10, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn = sortBy === 'title' ? page.title :
                             sortBy === 'updatedAt' ? page.updatedAt : 
                             page.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        // Get company info
        const companyInfo = await db.query.company.findFirst({
            where: and(eq(company.id, companyId), eq(company.isActive, true)),
        });

        if (!companyInfo) {
            return { company: undefined, pages: { data: [], pagination: { page: 1, pageSize, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false } } };
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

    async getActiveCompaniesByUser(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<typeof company.$inferSelect>> {
        const { 
            page = 1, 
            pageSize = 10, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = options;

        const offset = (page - 1) * pageSize;
        const orderByColumn = sortBy === 'name' ? company.name :
                             sortBy === 'updatedAt' ? company.updatedAt : 
                             company.createdAt;
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

    async softDeleteCompany(companyId: string) {
        return await db
            .update(company)
            .set({ 
                isActive: false, 
                updatedAt: new Date() 
            })
            .where(eq(company.id, companyId));
    },
};