import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { interaction, contact } from '@/db/schema';
import { nanoid } from 'nanoid';
import type { PaginationOptions, PaginatedResult } from './types';
import type { InteractionSelect, InteractionInsert } from '@/db/schema';

export type InteractionWithRelations = InteractionSelect & {
    company?: { id: string; name: string } | null;
    contact?: { id: string; firstName: string; lastName: string | null; email: string | null } | null;
    deal?: { id: string; name: string } | null;
    owner?: { id: string; name: string; email: string } | null;
};

export const interactionQueries = {
    // ============== Organization-scoped Methods ==============

    async createInteraction(
        organizationId: string,
        userId: string,
        data: Omit<InteractionInsert, 'id' | 'organizationId' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<InteractionSelect> {
        const id = nanoid();
        const now = new Date();

        const [newInteraction] = await db
            .insert(interaction)
            .values({
                id,
                organizationId,
                userId,
                ownerId: data.ownerId || userId,
                ...data,
                occurredAt: data.occurredAt ?? now,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Update contact's last contacted date
        if (data.contactId) {
            await db
                .update(contact)
                .set({ lastContactedAt: now, updatedAt: now })
                .where(eq(contact.id, data.contactId));
        }

        return newInteraction;
    },

    async getInteractionByIdForOrg(interactionId: string, organizationId: string): Promise<InteractionWithRelations> {
        const result = await db.query.interaction.findFirst({
            where: and(eq(interaction.id, interactionId), eq(interaction.organizationId, organizationId), eq(interaction.isActive, true)),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true, email: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
                owner: {
                    columns: { id: true, name: true, email: true },
                },
            },
        });

        if (!result) {
            throw new Error('Interaction not found');
        }

        return result;
    },

    async getOrganizationInteractions(
        organizationId: string,
        options: PaginationOptions & {
            type?: string;
            direction?: string;
            companyId?: string;
            contactId?: string;
            dealId?: string;
            ownerId?: string;
            startDate?: string;
            endDate?: string;
        } = {}
    ): Promise<PaginatedResult<InteractionWithRelations>> {
        const {
            page = 1,
            pageSize = 20,
            sortBy = 'occurredAt',
            sortOrder = 'desc',
            type,
            direction,
            companyId,
            contactId,
            dealId,
            ownerId,
            startDate,
            endDate,
        } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(interaction.organizationId, organizationId), eq(interaction.isActive, true)];

        if (type) conditions.push(eq(interaction.type, type as any));
        if (direction) conditions.push(eq(interaction.direction, direction as any));
        if (companyId) conditions.push(eq(interaction.companyId, companyId));
        if (contactId) conditions.push(eq(interaction.contactId, contactId));
        if (dealId) conditions.push(eq(interaction.dealId, dealId));
        if (ownerId) conditions.push(eq(interaction.ownerId, ownerId));
        if (startDate) conditions.push(gte(interaction.occurredAt, new Date(startDate)));
        if (endDate) conditions.push(lte(interaction.occurredAt, new Date(endDate)));

        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [interactions, countResult] = await Promise.all([
            db.query.interaction.findMany({
                where: and(...conditions),
                with: {
                    company: {
                        columns: { id: true, name: true },
                    },
                    contact: {
                        columns: { id: true, firstName: true, lastName: true, email: true },
                    },
                    deal: {
                        columns: { id: true, name: true },
                    },
                    owner: {
                        columns: { id: true, name: true, email: true },
                    },
                },
                orderBy: [orderDirection(interaction.occurredAt)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: interactions,
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

    async getEntityTimelineForOrg(
        organizationId: string,
        entityType: 'company' | 'contact' | 'deal',
        entityId: string,
        limit: number = 50
    ): Promise<InteractionWithRelations[]> {
        const condition =
            entityType === 'company'
                ? eq(interaction.companyId, entityId)
                : entityType === 'contact'
                  ? eq(interaction.contactId, entityId)
                  : eq(interaction.dealId, entityId);

        const interactions = await db.query.interaction.findMany({
            where: and(eq(interaction.organizationId, organizationId), condition, eq(interaction.isActive, true)),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true, email: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
                owner: {
                    columns: { id: true, name: true, email: true },
                },
            },
            orderBy: [desc(interaction.occurredAt)],
            limit,
        });

        return interactions;
    },

    async updateInteractionForOrg(
        interactionId: string,
        organizationId: string,
        data: Partial<Omit<InteractionInsert, 'id' | 'organizationId' | 'userId' | 'createdAt'>>
    ): Promise<InteractionSelect> {
        const [updatedInteraction] = await db
            .update(interaction)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(interaction.id, interactionId), eq(interaction.organizationId, organizationId)))
            .returning();

        if (!updatedInteraction) {
            throw new Error('Interaction not found');
        }

        return updatedInteraction;
    },

    async deleteInteractionForOrg(interactionId: string, organizationId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(interaction)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(interaction.id, interactionId), eq(interaction.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            throw new Error('Interaction not found');
        }

        return { success: true };
    },

    async getInteractionStatsForOrg(organizationId: string): Promise<{
        totalInteractions: number;
        byType: Record<string, number>;
        thisWeek: number;
        thisMonth: number;
    }> {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [total, thisWeek, thisMonth, byType] = await Promise.all([
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(eq(interaction.organizationId, organizationId), eq(interaction.isActive, true))),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(eq(interaction.organizationId, organizationId), eq(interaction.isActive, true), gte(interaction.occurredAt, weekAgo))),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(eq(interaction.organizationId, organizationId), eq(interaction.isActive, true), gte(interaction.occurredAt, monthAgo))),
            db
                .select({
                    type: interaction.type,
                    count: sql<number>`count(*)::int`,
                })
                .from(interaction)
                .where(and(eq(interaction.organizationId, organizationId), eq(interaction.isActive, true)))
                .groupBy(interaction.type),
        ]);

        const byTypeRecord: Record<string, number> = {};
        for (const row of byType) {
            byTypeRecord[row.type] = row.count;
        }

        return {
            totalInteractions: total[0]?.count || 0,
            byType: byTypeRecord,
            thisWeek: thisWeek[0]?.count || 0,
            thisMonth: thisMonth[0]?.count || 0,
        };
    },

    // ============== Legacy User-scoped Methods (for backwards compatibility) ==============

    async createInteractionLegacy(
        userId: string,
        data: Omit<InteractionInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<InteractionSelect> {
        const id = nanoid();
        const now = new Date();

        const [newInteraction] = await db
            .insert(interaction)
            .values({
                id,
                userId,
                ...data,
                occurredAt: data.occurredAt ?? now,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Update contact's last contacted date
        if (data.contactId) {
            await db
                .update(contact)
                .set({ lastContactedAt: now, updatedAt: now })
                .where(eq(contact.id, data.contactId));
        }

        return newInteraction;
    },

    async getInteractionById(interactionId: string, userId: string): Promise<InteractionWithRelations> {
        const result = await db.query.interaction.findFirst({
            where: and(eq(interaction.id, interactionId), eq(interaction.userId, userId), eq(interaction.isActive, true)),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true, email: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
            },
        });

        if (!result) {
            throw new Error('Interaction not found');
        }

        return result;
    },

    async getUserInteractions(
        userId: string,
        options: PaginationOptions & {
            type?: string;
            direction?: string;
            companyId?: string;
            contactId?: string;
            dealId?: string;
            startDate?: string;
            endDate?: string;
        } = {}
    ): Promise<PaginatedResult<InteractionWithRelations>> {
        const {
            page = 1,
            pageSize = 20,
            sortBy = 'occurredAt',
            sortOrder = 'desc',
            type,
            direction,
            companyId,
            contactId,
            dealId,
            startDate,
            endDate,
        } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(interaction.userId, userId), eq(interaction.isActive, true)];

        if (type) conditions.push(eq(interaction.type, type as any));
        if (direction) conditions.push(eq(interaction.direction, direction as any));
        if (companyId) conditions.push(eq(interaction.companyId, companyId));
        if (contactId) conditions.push(eq(interaction.contactId, contactId));
        if (dealId) conditions.push(eq(interaction.dealId, dealId));
        if (startDate) conditions.push(gte(interaction.occurredAt, new Date(startDate)));
        if (endDate) conditions.push(lte(interaction.occurredAt, new Date(endDate)));

        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [interactions, countResult] = await Promise.all([
            db.query.interaction.findMany({
                where: and(...conditions),
                with: {
                    company: {
                        columns: { id: true, name: true },
                    },
                    contact: {
                        columns: { id: true, firstName: true, lastName: true, email: true },
                    },
                    deal: {
                        columns: { id: true, name: true },
                    },
                },
                orderBy: [orderDirection(interaction.occurredAt)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: interactions,
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

    async getEntityTimeline(
        userId: string,
        entityType: 'company' | 'contact' | 'deal',
        entityId: string,
        limit: number = 50
    ): Promise<InteractionWithRelations[]> {
        const condition =
            entityType === 'company'
                ? eq(interaction.companyId, entityId)
                : entityType === 'contact'
                  ? eq(interaction.contactId, entityId)
                  : eq(interaction.dealId, entityId);

        const interactions = await db.query.interaction.findMany({
            where: and(eq(interaction.userId, userId), condition, eq(interaction.isActive, true)),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true, email: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
            },
            orderBy: [desc(interaction.occurredAt)],
            limit,
        });

        return interactions;
    },

    async updateInteraction(
        interactionId: string,
        userId: string,
        data: Partial<Omit<InteractionInsert, 'id' | 'userId' | 'createdAt'>>
    ): Promise<InteractionSelect> {
        const [updatedInteraction] = await db
            .update(interaction)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(interaction.id, interactionId), eq(interaction.userId, userId)))
            .returning();

        if (!updatedInteraction) {
            throw new Error('Interaction not found');
        }

        return updatedInteraction;
    },

    async deleteInteraction(interactionId: string, userId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(interaction)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(interaction.id, interactionId), eq(interaction.userId, userId)))
            .returning();

        if (!deleted) {
            throw new Error('Interaction not found');
        }

        return { success: true };
    },

    async getInteractionStats(userId: string): Promise<{
        totalInteractions: number;
        byType: Record<string, number>;
        thisWeek: number;
        thisMonth: number;
    }> {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [total, thisWeek, thisMonth, byType] = await Promise.all([
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(eq(interaction.userId, userId), eq(interaction.isActive, true))),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(eq(interaction.userId, userId), eq(interaction.isActive, true), gte(interaction.occurredAt, weekAgo))),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(interaction)
                .where(and(eq(interaction.userId, userId), eq(interaction.isActive, true), gte(interaction.occurredAt, monthAgo))),
            db
                .select({
                    type: interaction.type,
                    count: sql<number>`count(*)::int`,
                })
                .from(interaction)
                .where(and(eq(interaction.userId, userId), eq(interaction.isActive, true)))
                .groupBy(interaction.type),
        ]);

        const byTypeRecord: Record<string, number> = {};
        for (const row of byType) {
            byTypeRecord[row.type] = row.count;
        }

        return {
            totalInteractions: total[0]?.count || 0,
            byType: byTypeRecord,
            thisWeek: thisWeek[0]?.count || 0,
            thisMonth: thisMonth[0]?.count || 0,
        };
    },
};
