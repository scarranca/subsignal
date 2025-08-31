import { and, eq, desc, asc, count } from 'drizzle-orm';
import { db } from '../index';
import { user } from '../schema/auth';
import { preference } from '../schema/preference';
import { company } from '../schema/company';
import { page } from '../schema/page';
import type { PaginationOptions, PaginatedResult } from './types';
import { withDbTiming } from '@/lib/db-timing';
import type { Context } from 'hono';

export const userQueries = {
    async getUserPreference(userId: string, context?: Context) {
        return await withDbTiming(
            () =>
                db.query.user.findFirst({
                    where: eq(user.id, userId),
                    with: {
                        preference: true,
                    },
                }),
            'user-preference-query',
            context,
            'Get user with preferences join',
        );
    },

    async getUserCompanies(
        userId: string,
        options: PaginationOptions = {},
        context?: Context,
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

        // Get total count with timing
        const [totalResult] = await withDbTiming(
            () =>
                db
                    .select({ count: count() })
                    .from(company)
                    .where(and(eq(company.userId, userId), eq(company.isActive, true))),
            'user-companies-count',
            context,
            'Count total user companies',
        );

        const totalItems = totalResult.count;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated data with timing
        const data = await withDbTiming(
            () =>
                db
                    .select()
                    .from(company)
                    .where(and(eq(company.userId, userId), eq(company.isActive, true)))
                    .orderBy(orderDirection(orderByColumn))
                    .limit(pageSize)
                    .offset(offset),
            'user-companies-data',
            context,
            `Get paginated user companies (page ${currentPage}, size ${pageSize})`,
        );

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

    async getUserEmailByUserId(userId: string, context?: Context) {
        return await withDbTiming(
            () =>
                db.query.user.findFirst({
                    where: eq(user.id, userId),
                    columns: {
                        email: true,
                    },
                }),
            'user-email-by-id',
            context,
            'Get user email by ID',
        );
    },

    async getUserRecordByEmail(email: string, context?: Context) {
        return await withDbTiming(
            () =>
                db.query.user.findFirst({
                    where: eq(user.email, email),
                }),
            'user-record-by-email',
            context,
            'Get user record by email',
        );
    },
};
