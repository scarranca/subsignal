import { eq, and, desc, asc, sql, ilike, or, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { deal, pipelineStage, pipeline } from '@/db/schema';
import { nanoid } from 'nanoid';
import type { PaginationOptions, PaginatedResult } from './types';
import type { DealSelect, DealInsert } from '@/db/schema';

export type DealWithRelations = DealSelect & {
    company?: { id: string; name: string } | null;
    contact?: { id: string; firstName: string; lastName: string | null } | null;
    stage?: { id: string; name: string; color: string; probability: number } | null;
    pipeline?: { id: string; name: string } | null;
};

export type PipelineDeals = {
    pipeline: { id: string; name: string };
    stages: Array<{
        id: string;
        name: string;
        color: string;
        probability: number;
        position: number;
        deals: DealWithRelations[];
        totalValue: number;
        dealCount: number;
    }>;
    totalValue: number;
    totalDeals: number;
};

export const dealQueries = {
    async createDeal(
        userId: string,
        data: Omit<DealInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<DealSelect> {
        const id = nanoid();
        const now = new Date();

        const [newDeal] = await db
            .insert(deal)
            .values({
                id,
                userId,
                ...data,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return newDeal;
    },

    async getDealById(dealId: string, userId: string): Promise<DealWithRelations> {
        const result = await db.query.deal.findFirst({
            where: and(eq(deal.id, dealId), eq(deal.userId, userId), eq(deal.isActive, true)),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                stage: {
                    columns: { id: true, name: true, color: true, probability: true },
                },
                pipeline: {
                    columns: { id: true, name: true },
                },
            },
        });

        if (!result) {
            throw new Error('Deal not found');
        }

        return result;
    },

    async getUserDeals(
        userId: string,
        options: PaginationOptions & {
            pipelineId?: string;
            stageId?: string;
            status?: string;
            priority?: string;
            companyId?: string;
            contactId?: string;
            minValue?: number;
            maxValue?: number;
            search?: string;
        } = {}
    ): Promise<PaginatedResult<DealWithRelations>> {
        const {
            page = 1,
            pageSize = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            pipelineId,
            stageId,
            status,
            priority,
            companyId,
            contactId,
            minValue,
            maxValue,
            search,
        } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(deal.userId, userId), eq(deal.isActive, true)];

        if (pipelineId) conditions.push(eq(deal.pipelineId, pipelineId));
        if (stageId) conditions.push(eq(deal.stageId, stageId));
        if (status) conditions.push(eq(deal.status, status as any));
        if (priority) conditions.push(eq(deal.priority, priority as any));
        if (companyId) conditions.push(eq(deal.companyId, companyId));
        if (contactId) conditions.push(eq(deal.contactId, contactId));
        if (minValue !== undefined) conditions.push(gte(deal.value, minValue.toString()));
        if (maxValue !== undefined) conditions.push(lte(deal.value, maxValue.toString()));
        if (search) {
            conditions.push(ilike(deal.name, `%${search}%`));
        }

        const orderByColumn = sortBy === 'name' ? deal.name : deal[sortBy as keyof typeof deal] || deal.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [deals, countResult] = await Promise.all([
            db.query.deal.findMany({
                where: and(...conditions),
                with: {
                    company: {
                        columns: { id: true, name: true },
                    },
                    contact: {
                        columns: { id: true, firstName: true, lastName: true },
                    },
                    stage: {
                        columns: { id: true, name: true, color: true, probability: true },
                    },
                    pipeline: {
                        columns: { id: true, name: true },
                    },
                },
                orderBy: [orderDirection(orderByColumn as any)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(deal)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: deals,
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

    async getPipelineDeals(userId: string, pipelineId: string): Promise<PipelineDeals> {
        const pipelineData = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.id, pipelineId), eq(pipeline.userId, userId), eq(pipeline.isActive, true)),
            with: {
                stages: {
                    orderBy: [asc(pipelineStage.position)],
                },
            },
        });

        if (!pipelineData) {
            throw new Error('Pipeline not found');
        }

        const deals = await db.query.deal.findMany({
            where: and(eq(deal.userId, userId), eq(deal.pipelineId, pipelineId), eq(deal.isActive, true), eq(deal.status, 'open')),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                stage: {
                    columns: { id: true, name: true, color: true, probability: true },
                },
            },
            orderBy: [desc(deal.createdAt)],
        });

        const stagesWithDeals = pipelineData.stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stageId === stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + (parseFloat(d.value?.toString() || '0') || 0), 0);

            return {
                ...stage,
                deals: stageDeals.map((d) => ({ ...d, pipeline: { id: pipelineData.id, name: pipelineData.name } })),
                totalValue,
                dealCount: stageDeals.length,
            };
        });

        const totalValue = stagesWithDeals.reduce((sum, s) => sum + s.totalValue, 0);
        const totalDeals = deals.length;

        return {
            pipeline: { id: pipelineData.id, name: pipelineData.name },
            stages: stagesWithDeals,
            totalValue,
            totalDeals,
        };
    },

    async updateDeal(
        dealId: string,
        userId: string,
        data: Partial<Omit<DealInsert, 'id' | 'userId' | 'createdAt'>>
    ): Promise<DealSelect> {
        const [updatedDeal] = await db
            .update(deal)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(deal.id, dealId), eq(deal.userId, userId)))
            .returning();

        if (!updatedDeal) {
            throw new Error('Deal not found');
        }

        return updatedDeal;
    },

    async moveDealToStage(dealId: string, userId: string, stageId: string): Promise<DealSelect> {
        // Get stage info to check for won/lost status
        const stage = await db.query.pipelineStage.findFirst({
            where: eq(pipelineStage.id, stageId),
        });

        if (!stage) {
            throw new Error('Stage not found');
        }

        const updateData: Partial<DealInsert> = {
            stageId,
            updatedAt: new Date(),
        };

        // Auto-set status based on stage type
        if (stage.isWonStage) {
            updateData.status = 'won';
            updateData.actualCloseDate = new Date();
        } else if (stage.isLostStage) {
            updateData.status = 'lost';
            updateData.actualCloseDate = new Date();
        }

        const [updatedDeal] = await db
            .update(deal)
            .set(updateData)
            .where(and(eq(deal.id, dealId), eq(deal.userId, userId)))
            .returning();

        if (!updatedDeal) {
            throw new Error('Deal not found');
        }

        return updatedDeal;
    },

    async deleteDeal(dealId: string, userId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(deal)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(deal.id, dealId), eq(deal.userId, userId)))
            .returning();

        if (!deleted) {
            throw new Error('Deal not found');
        }

        return { success: true };
    },

    async getDealStats(userId: string, pipelineId?: string): Promise<{
        totalDeals: number;
        openDeals: number;
        wonDeals: number;
        lostDeals: number;
        totalValue: number;
        wonValue: number;
        avgDealSize: number;
    }> {
        const conditions = [eq(deal.userId, userId), eq(deal.isActive, true)];
        if (pipelineId) conditions.push(eq(deal.pipelineId, pipelineId));

        const stats = await db
            .select({
                totalDeals: sql<number>`count(*)::int`,
                openDeals: sql<number>`count(*) filter (where ${deal.status} = 'open')::int`,
                wonDeals: sql<number>`count(*) filter (where ${deal.status} = 'won')::int`,
                lostDeals: sql<number>`count(*) filter (where ${deal.status} = 'lost')::int`,
                totalValue: sql<number>`coalesce(sum(${deal.value}), 0)::numeric`,
                wonValue: sql<number>`coalesce(sum(${deal.value}) filter (where ${deal.status} = 'won'), 0)::numeric`,
            })
            .from(deal)
            .where(and(...conditions));

        const result = stats[0];
        const avgDealSize = result.totalDeals > 0 ? result.totalValue / result.totalDeals : 0;

        return {
            ...result,
            avgDealSize,
        };
    },

    async getDealCount(userId: string): Promise<number> {
        const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(deal)
            .where(and(eq(deal.userId, userId), eq(deal.isActive, true)));

        return result[0]?.count || 0;
    },
};
