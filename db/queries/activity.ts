import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { activity } from '@/db/schema';
import { nanoid } from 'nanoid';
import type { PaginationOptions, PaginatedResult } from './types';
import type { ActivitySelect, ActivityInsert, ActivityAction, ActivityEntityType } from '@/db/schema';

export const activityQueries = {
    // ============== Organization-scoped Methods ==============

    async logActivityForOrg(
        organizationId: string,
        userId: string,
        data: {
            entityType: ActivityEntityType;
            entityId: string;
            entityName?: string;
            action: ActivityAction;
            description?: string;
            changes?: {
                before?: Record<string, unknown>;
                after?: Record<string, unknown>;
                fields?: string[];
            };
            relatedCompanyId?: string;
            relatedContactId?: string;
            relatedDealId?: string;
            metadata?: Record<string, unknown>;
        }
    ): Promise<ActivitySelect> {
        const id = nanoid();
        const now = new Date();

        const [newActivity] = await db
            .insert(activity)
            .values({
                id,
                organizationId,
                userId,
                entityType: data.entityType,
                entityId: data.entityId,
                entityName: data.entityName,
                action: data.action,
                description: data.description,
                changes: data.changes,
                relatedCompanyId: data.relatedCompanyId,
                relatedContactId: data.relatedContactId,
                relatedDealId: data.relatedDealId,
                metadata: data.metadata,
                occurredAt: now,
                createdAt: now,
            })
            .returning();

        return newActivity;
    },

    async getOrganizationActivities(
        organizationId: string,
        options: PaginationOptions & {
            entityType?: string;
            entityId?: string;
            action?: string;
            userId?: string;
            companyId?: string;
            contactId?: string;
            dealId?: string;
            startDate?: string;
            endDate?: string;
        } = {}
    ): Promise<PaginatedResult<ActivitySelect>> {
        const {
            page = 1,
            pageSize = 50,
            entityType,
            entityId,
            action,
            userId,
            companyId,
            contactId,
            dealId,
            startDate,
            endDate,
        } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(activity.organizationId, organizationId)];

        if (entityType) conditions.push(eq(activity.entityType, entityType as any));
        if (entityId) conditions.push(eq(activity.entityId, entityId));
        if (action) conditions.push(eq(activity.action, action as any));
        if (userId) conditions.push(eq(activity.userId, userId));
        if (companyId) conditions.push(eq(activity.relatedCompanyId, companyId));
        if (contactId) conditions.push(eq(activity.relatedContactId, contactId));
        if (dealId) conditions.push(eq(activity.relatedDealId, dealId));
        if (startDate) conditions.push(gte(activity.occurredAt, new Date(startDate)));
        if (endDate) conditions.push(lte(activity.occurredAt, new Date(endDate)));

        const [activities, countResult] = await Promise.all([
            db.query.activity.findMany({
                where: and(...conditions),
                orderBy: [desc(activity.occurredAt)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(activity)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: activities,
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

    async getEntityActivitiesForOrg(
        organizationId: string,
        entityType: ActivityEntityType,
        entityId: string,
        limit: number = 50
    ): Promise<ActivitySelect[]> {
        const activities = await db.query.activity.findMany({
            where: and(
                eq(activity.organizationId, organizationId),
                eq(activity.entityType, entityType),
                eq(activity.entityId, entityId)
            ),
            orderBy: [desc(activity.occurredAt)],
            limit,
        });

        return activities;
    },

    async getRecentActivitiesForOrg(organizationId: string, limit: number = 20): Promise<ActivitySelect[]> {
        const activities = await db.query.activity.findMany({
            where: eq(activity.organizationId, organizationId),
            orderBy: [desc(activity.occurredAt)],
            limit,
        });

        return activities;
    },

    async getActivityStatsForOrg(organizationId: string, days: number = 30): Promise<{
        totalActivities: number;
        byAction: Record<string, number>;
        byEntityType: Record<string, number>;
        dailyBreakdown: Array<{ date: string; count: number }>;
    }> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [total, byAction, byEntityType, daily] = await Promise.all([
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(activity)
                .where(and(eq(activity.organizationId, organizationId), gte(activity.occurredAt, startDate))),
            db
                .select({
                    action: activity.action,
                    count: sql<number>`count(*)::int`,
                })
                .from(activity)
                .where(and(eq(activity.organizationId, organizationId), gte(activity.occurredAt, startDate)))
                .groupBy(activity.action),
            db
                .select({
                    entityType: activity.entityType,
                    count: sql<number>`count(*)::int`,
                })
                .from(activity)
                .where(and(eq(activity.organizationId, organizationId), gte(activity.occurredAt, startDate)))
                .groupBy(activity.entityType),
            db
                .select({
                    date: sql<string>`date(${activity.occurredAt})::text`,
                    count: sql<number>`count(*)::int`,
                })
                .from(activity)
                .where(and(eq(activity.organizationId, organizationId), gte(activity.occurredAt, startDate)))
                .groupBy(sql`date(${activity.occurredAt})`)
                .orderBy(sql`date(${activity.occurredAt})`),
        ]);

        const byActionRecord: Record<string, number> = {};
        for (const row of byAction) {
            byActionRecord[row.action] = row.count;
        }

        const byEntityTypeRecord: Record<string, number> = {};
        for (const row of byEntityType) {
            byEntityTypeRecord[row.entityType] = row.count;
        }

        return {
            totalActivities: total[0]?.count || 0,
            byAction: byActionRecord,
            byEntityType: byEntityTypeRecord,
            dailyBreakdown: daily,
        };
    },

    // ============== Legacy User-scoped Methods (for backwards compatibility) ==============

    async logActivity(
        userId: string,
        data: {
            entityType: ActivityEntityType;
            entityId: string;
            entityName?: string;
            action: ActivityAction;
            description?: string;
            changes?: {
                before?: Record<string, unknown>;
                after?: Record<string, unknown>;
                fields?: string[];
            };
            relatedCompanyId?: string;
            relatedContactId?: string;
            relatedDealId?: string;
            metadata?: Record<string, unknown>;
        }
    ): Promise<ActivitySelect> {
        const id = nanoid();
        const now = new Date();

        const [newActivity] = await db
            .insert(activity)
            .values({
                id,
                userId,
                entityType: data.entityType,
                entityId: data.entityId,
                entityName: data.entityName,
                action: data.action,
                description: data.description,
                changes: data.changes,
                relatedCompanyId: data.relatedCompanyId,
                relatedContactId: data.relatedContactId,
                relatedDealId: data.relatedDealId,
                metadata: data.metadata,
                occurredAt: now,
                createdAt: now,
            })
            .returning();

        return newActivity;
    },

    async getUserActivities(
        userId: string,
        options: PaginationOptions & {
            entityType?: string;
            entityId?: string;
            action?: string;
            companyId?: string;
            contactId?: string;
            dealId?: string;
            startDate?: string;
            endDate?: string;
        } = {}
    ): Promise<PaginatedResult<ActivitySelect>> {
        const {
            page = 1,
            pageSize = 50,
            entityType,
            entityId,
            action,
            companyId,
            contactId,
            dealId,
            startDate,
            endDate,
        } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(activity.userId, userId)];

        if (entityType) conditions.push(eq(activity.entityType, entityType as any));
        if (entityId) conditions.push(eq(activity.entityId, entityId));
        if (action) conditions.push(eq(activity.action, action as any));
        if (companyId) conditions.push(eq(activity.relatedCompanyId, companyId));
        if (contactId) conditions.push(eq(activity.relatedContactId, contactId));
        if (dealId) conditions.push(eq(activity.relatedDealId, dealId));
        if (startDate) conditions.push(gte(activity.occurredAt, new Date(startDate)));
        if (endDate) conditions.push(lte(activity.occurredAt, new Date(endDate)));

        const [activities, countResult] = await Promise.all([
            db.query.activity.findMany({
                where: and(...conditions),
                orderBy: [desc(activity.occurredAt)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(activity)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: activities,
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

    async getEntityActivities(
        userId: string,
        entityType: ActivityEntityType,
        entityId: string,
        limit: number = 50
    ): Promise<ActivitySelect[]> {
        const activities = await db.query.activity.findMany({
            where: and(
                eq(activity.userId, userId),
                eq(activity.entityType, entityType),
                eq(activity.entityId, entityId)
            ),
            orderBy: [desc(activity.occurredAt)],
            limit,
        });

        return activities;
    },

    async getRecentActivities(userId: string, limit: number = 20): Promise<ActivitySelect[]> {
        const activities = await db.query.activity.findMany({
            where: eq(activity.userId, userId),
            orderBy: [desc(activity.occurredAt)],
            limit,
        });

        return activities;
    },

    async getActivityStats(userId: string, days: number = 30): Promise<{
        totalActivities: number;
        byAction: Record<string, number>;
        byEntityType: Record<string, number>;
        dailyBreakdown: Array<{ date: string; count: number }>;
    }> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [total, byAction, byEntityType, daily] = await Promise.all([
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(activity)
                .where(and(eq(activity.userId, userId), gte(activity.occurredAt, startDate))),
            db
                .select({
                    action: activity.action,
                    count: sql<number>`count(*)::int`,
                })
                .from(activity)
                .where(and(eq(activity.userId, userId), gte(activity.occurredAt, startDate)))
                .groupBy(activity.action),
            db
                .select({
                    entityType: activity.entityType,
                    count: sql<number>`count(*)::int`,
                })
                .from(activity)
                .where(and(eq(activity.userId, userId), gte(activity.occurredAt, startDate)))
                .groupBy(activity.entityType),
            db
                .select({
                    date: sql<string>`date(${activity.occurredAt})::text`,
                    count: sql<number>`count(*)::int`,
                })
                .from(activity)
                .where(and(eq(activity.userId, userId), gte(activity.occurredAt, startDate)))
                .groupBy(sql`date(${activity.occurredAt})`)
                .orderBy(sql`date(${activity.occurredAt})`),
        ]);

        const byActionRecord: Record<string, number> = {};
        for (const row of byAction) {
            byActionRecord[row.action] = row.count;
        }

        const byEntityTypeRecord: Record<string, number> = {};
        for (const row of byEntityType) {
            byEntityTypeRecord[row.entityType] = row.count;
        }

        return {
            totalActivities: total[0]?.count || 0,
            byAction: byActionRecord,
            byEntityType: byEntityTypeRecord,
            dailyBreakdown: daily,
        };
    },
};
