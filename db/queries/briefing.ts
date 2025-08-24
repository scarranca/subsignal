import { and, eq, desc, asc, count, inArray } from 'drizzle-orm';
import { db } from '../index';
import { company } from '../schema/company';
import { briefing } from '../schema/briefing';
import type { PaginationOptions, PaginatedResult } from './types';

export const briefingQueries = {
    async createBriefing(companyId: string, companyUrl: string, briefingText: string) {
        const [newBriefing] = await db
            .insert(briefing)
            .values({
                companyId: companyId,
                companyUrl: companyUrl,
                briefing: briefingText,
            })
            .returning();

        return newBriefing;
    },

    async listBriefings(
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof briefing.$inferSelect>> {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn = sortBy === 'updatedAt' ? briefing.updatedAt : briefing.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [{ count: totalItems }] = await db.select({ count: count() }).from(briefing);

        const totalPages = Math.ceil(totalItems / pageSize);

        const briefings = await db
            .select()
            .from(briefing)
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: briefings,
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

    async getLastBriefingForCompany(companyId: string) {
        const [lastBriefing] = await db
            .select()
            .from(briefing)
            .where(eq(briefing.companyId, companyId))
            .orderBy(desc(briefing.createdAt))
            .limit(1);

        return lastBriefing;
    },

    async getPaginatedBriefingsForCompany(
        companyId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof briefing.$inferSelect>> {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn = sortBy === 'updatedAt' ? briefing.updatedAt : briefing.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [{ count: totalItems }] = await db
            .select({ count: count() })
            .from(briefing)
            .where(eq(briefing.companyId, companyId));

        const totalPages = Math.ceil(totalItems / pageSize);

        const briefings = await db
            .select()
            .from(briefing)
            .where(eq(briefing.companyId, companyId))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: briefings,
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

    async getPaginatedBriefingsForUser(
        userId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof briefing.$inferSelect & { companyName: string }>> {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn = sortBy === 'updatedAt' ? briefing.updatedAt : briefing.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        // Get all active companies for the user
        const userCompanies = await db
            .select({ id: company.id })
            .from(company)
            .where(and(eq(company.userId, userId), eq(company.isActive, true)));

        const companyIds = userCompanies.map((c) => c.id);

        if (companyIds.length === 0) {
            return {
                data: [],
                pagination: {
                    page: currentPage,
                    pageSize,
                    totalItems: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false,
                },
            };
        }

        const [{ count: totalItems }] = await db
            .select({ count: count() })
            .from(briefing)
            .where(inArray(briefing.companyId, companyIds));

        const totalPages = Math.ceil(totalItems / pageSize);

        const briefings = await db
            .select({
                id: briefing.id,
                companyId: briefing.companyId,
                companyUrl: briefing.companyUrl,
                briefing: briefing.briefing,
                createdAt: briefing.createdAt,
                updatedAt: briefing.updatedAt,
                companyName: company.name,
            })
            .from(briefing)
            .innerJoin(company, eq(briefing.companyId, company.id))
            .where(inArray(briefing.companyId, companyIds))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: briefings,
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

    async getBriefingById(briefingId: number) {
        const [result] = await db
            .select()
            .from(briefing)
            .where(eq(briefing.id, briefingId))
            .limit(1);

        if (!result) {
            throw new Error('Briefing not found');
        }

        return result;
    },
};
