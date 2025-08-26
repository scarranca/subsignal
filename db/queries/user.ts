import { and, eq, desc, asc, count } from 'drizzle-orm';
import { db } from '../index';
import { user } from '../schema/auth';
import { preference } from '../schema/preference';
import { company } from '../schema/company';
import { page } from '../schema/page';
import type { PaginationOptions, PaginatedResult } from './types';

export const userQueries = {
    async getUserPreference(userId: string) {
        return await db.query.user.findFirst({
            where: eq(user.id, userId),
            with: {
                preference: true,
            },
        });
    },

    async getUserCompanies(
        userId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof company.$inferSelect>> {
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
                page: currentPage,
                pageSize,
                totalItems,
                totalPages,
                hasNext: currentPage < totalPages,
                hasPrevious: currentPage > 1,
            },
        };
    },

    async getUserEmailByUserId(userId: string) {
        return await db.query.user.findFirst({
            where: eq(user.id, userId),
            columns: {
                email: true,
            },
        });
    },

    async getUserRecordByEmail(email: string) {
        return await db.query.user.findFirst({
            where: eq(user.email, email),
        });
    },
};
