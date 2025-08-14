import { and, eq, desc, asc, count } from 'drizzle-orm';
import { db } from './index';
import { user } from './schema/auth';
import { preference } from './schema/preference';
import { company } from './schema/company';
import { page } from './schema/page';

type PaginationOptions = {
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'title';
    sortOrder?: 'asc' | 'desc';
};

type PaginatedResult<T> = {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
};

export const userQueries = {
    async getUserPreference(userId: string) {
        return await db.query.user.findFirst({
            where: eq(user.id, userId),
            with: {
                preference: {
                    where: eq(preference.isActive, true),
                },
            },
        });
    },

    async getUserCompanies(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<typeof company.$inferSelect>> {
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

    async getUserCompaniesWithPages(userId: string, options: PaginationOptions = {}) {
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

        // Get total count of companies
        const [totalResult] = await db
            .select({ count: count() })
            .from(company)
            .where(and(eq(company.userId, userId), eq(company.isActive, true)));

        const totalItems = totalResult.count;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated companies with pages
        const companies = await db.query.company.findMany({
            where: and(eq(company.userId, userId), eq(company.isActive, true)),
            with: {
                pages: {
                    where: eq(page.isActive, true),
                    orderBy: page.createdAt,
                },
            },
            orderBy: orderDirection(orderByColumn),
            limit: pageSize,
            offset: offset,
        });

        return {
            data: companies,
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
};

export const companyQueries = {
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

export const pageQueries = {
    async getActivePagesByCompany(companyId: string, options: PaginationOptions = {}): Promise<PaginatedResult<typeof page.$inferSelect>> {
        const { 
            page = 1, 
            pageSize = 10, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = options;

        const offset = (page - 1) * pageSize;
        const orderByColumn = sortBy === 'title' ? page.title :
                             sortBy === 'updatedAt' ? page.updatedAt : 
                             page.createdAt;
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
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    },

    async getActivePagesByUser(userId: string, options: PaginationOptions = {}) {
        const { 
            page = 1, 
            pageSize = 10, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = options;

        const offset = (page - 1) * pageSize;

        // Get total count of pages across all user's companies
        const [totalResult] = await db
            .select({ count: count() })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(and(
                eq(company.userId, userId),
                eq(company.isActive, true),
                eq(page.isActive, true)
            ));

        const totalItems = totalResult.count;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated pages with company info
        const orderByColumn = sortBy === 'title' ? page.title :
                             sortBy === 'updatedAt' ? page.updatedAt : 
                             page.createdAt;
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
            .where(and(
                eq(company.userId, userId),
                eq(company.isActive, true),
                eq(page.isActive, true)
            ))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: pagesWithCompany,
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

    async softDeletePage(pageId: string) {
        return await db
            .update(page)
            .set({ 
                isActive: false, 
                updatedAt: new Date() 
            })
            .where(eq(page.id, pageId));
    },
};

export const preferenceQueries = {
    async getUserPreference(userId: string) {
        return await db.query.preference.findFirst({
            where: and(eq(preference.userId, userId), eq(preference.isActive, true)),
        });
    },

    async upsertUserPreference(userId: string, data: {
        properties: string[];
        frequency: 'pricing' | 'product' | 'customer' | 'partnership' | 'branding' | 'messaging';
    }) {
        const existingPreference = await db.query.preference.findFirst({
            where: eq(preference.userId, userId),
        });

        if (existingPreference) {
            return await db
                .update(preference)
                .set({
                    ...data,
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(preference.userId, userId));
        } else {
            return await db
                .insert(preference)
                .values({
                    id: crypto.randomUUID(),
                    userId,
                    ...data,
                    isActive: true,
                });
        }
    },

    async softDeletePreference(userId: string) {
        return await db
            .update(preference)
            .set({ 
                isActive: false, 
                updatedAt: new Date() 
            })
            .where(eq(preference.userId, userId));
    },
};