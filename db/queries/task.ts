import { eq, and, desc, asc, sql, gte, lte, lt, isNull, or } from 'drizzle-orm';
import { db } from '@/db';
import { task } from '@/db/schema';
import { nanoid } from 'nanoid';
import type { PaginationOptions, PaginatedResult } from './types';
import type { TaskSelect, TaskInsert } from '@/db/schema';

export type TaskWithRelations = TaskSelect & {
    company?: { id: string; name: string } | null;
    contact?: { id: string; firstName: string; lastName: string | null } | null;
    deal?: { id: string; name: string } | null;
    assignedTo?: { id: string; name: string; email: string } | null;
    owner?: { id: string; name: string; email: string } | null;
};

export const taskQueries = {
    // ============== Organization-scoped Methods ==============

    async createTask(
        organizationId: string,
        userId: string,
        data: Omit<TaskInsert, 'id' | 'organizationId' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<TaskSelect> {
        const id = nanoid();
        const now = new Date();

        const [newTask] = await db
            .insert(task)
            .values({
                id,
                organizationId,
                userId,
                ownerId: data.ownerId || userId,
                ...data,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return newTask;
    },

    async getTaskByIdForOrg(taskId: string, organizationId: string): Promise<TaskWithRelations> {
        const result = await db.query.task.findFirst({
            where: and(eq(task.id, taskId), eq(task.organizationId, organizationId), eq(task.isActive, true)),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
                assignedTo: {
                    columns: { id: true, name: true, email: true },
                },
                owner: {
                    columns: { id: true, name: true, email: true },
                },
            },
        });

        if (!result) {
            throw new Error('Task not found');
        }

        return result;
    },

    async getOrganizationTasks(
        organizationId: string,
        options: PaginationOptions & {
            status?: string;
            priority?: string;
            type?: string;
            companyId?: string;
            contactId?: string;
            dealId?: string;
            ownerId?: string;
            assignedToId?: string;
            dueBefore?: string;
            dueAfter?: string;
            overdue?: boolean;
        } = {}
    ): Promise<PaginatedResult<TaskWithRelations>> {
        const {
            page = 1,
            pageSize = 20,
            sortBy = 'dueDate',
            sortOrder = 'asc',
            status,
            priority,
            type,
            companyId,
            contactId,
            dealId,
            ownerId,
            assignedToId,
            dueBefore,
            dueAfter,
            overdue,
        } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(task.organizationId, organizationId), eq(task.isActive, true)];

        if (status) conditions.push(eq(task.status, status as any));
        if (priority) conditions.push(eq(task.priority, priority as any));
        if (type) conditions.push(eq(task.type, type as any));
        if (companyId) conditions.push(eq(task.companyId, companyId));
        if (contactId) conditions.push(eq(task.contactId, contactId));
        if (dealId) conditions.push(eq(task.dealId, dealId));
        if (ownerId) conditions.push(eq(task.ownerId, ownerId));
        if (assignedToId) conditions.push(eq(task.assignedToId, assignedToId));
        if (dueBefore) conditions.push(lte(task.dueDate, new Date(dueBefore)));
        if (dueAfter) conditions.push(gte(task.dueDate, new Date(dueAfter)));
        if (overdue) {
            conditions.push(lt(task.dueDate, new Date()));
            conditions.push(
                or(eq(task.status, 'pending'), eq(task.status, 'in_progress'))!
            );
        }

        const orderDirection = sortOrder === 'asc' ? asc : desc;
        const orderByColumn = sortBy === 'name' ? task.title : task[sortBy as keyof typeof task] || task.dueDate;

        const [tasks, countResult] = await Promise.all([
            db.query.task.findMany({
                where: and(...conditions),
                with: {
                    company: {
                        columns: { id: true, name: true },
                    },
                    contact: {
                        columns: { id: true, firstName: true, lastName: true },
                    },
                    deal: {
                        columns: { id: true, name: true },
                    },
                    assignedTo: {
                        columns: { id: true, name: true, email: true },
                    },
                    owner: {
                        columns: { id: true, name: true, email: true },
                    },
                },
                orderBy: [orderDirection(orderByColumn as any)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(task)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: tasks,
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

    async getUpcomingTasksForOrg(organizationId: string, days: number = 7): Promise<TaskWithRelations[]> {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const tasks = await db.query.task.findMany({
            where: and(
                eq(task.organizationId, organizationId),
                eq(task.isActive, true),
                or(eq(task.status, 'pending'), eq(task.status, 'in_progress')),
                gte(task.dueDate, now),
                lte(task.dueDate, futureDate)
            ),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
                owner: {
                    columns: { id: true, name: true, email: true },
                },
            },
            orderBy: [asc(task.dueDate)],
            limit: 50,
        });

        return tasks;
    },

    async getOverdueTasksForOrg(organizationId: string): Promise<TaskWithRelations[]> {
        const now = new Date();

        const tasks = await db.query.task.findMany({
            where: and(
                eq(task.organizationId, organizationId),
                eq(task.isActive, true),
                or(eq(task.status, 'pending'), eq(task.status, 'in_progress')),
                lt(task.dueDate, now)
            ),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
                owner: {
                    columns: { id: true, name: true, email: true },
                },
            },
            orderBy: [asc(task.dueDate)],
        });

        return tasks;
    },

    async updateTaskForOrg(
        taskId: string,
        organizationId: string,
        data: Partial<Omit<TaskInsert, 'id' | 'organizationId' | 'userId' | 'createdAt'>>
    ): Promise<TaskSelect> {
        const [updatedTask] = await db
            .update(task)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(task.id, taskId), eq(task.organizationId, organizationId)))
            .returning();

        if (!updatedTask) {
            throw new Error('Task not found');
        }

        return updatedTask;
    },

    async completeTaskForOrg(taskId: string, organizationId: string): Promise<TaskSelect> {
        const now = new Date();

        const [completedTask] = await db
            .update(task)
            .set({
                status: 'completed',
                completedAt: now,
                updatedAt: now,
            })
            .where(and(eq(task.id, taskId), eq(task.organizationId, organizationId)))
            .returning();

        if (!completedTask) {
            throw new Error('Task not found');
        }

        return completedTask;
    },

    async deleteTaskForOrg(taskId: string, organizationId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(task)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(task.id, taskId), eq(task.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            throw new Error('Task not found');
        }

        return { success: true };
    },

    async getTaskStatsForOrg(organizationId: string): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        overdue: number;
        dueToday: number;
        dueThisWeek: number;
    }> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const stats = await db
            .select({
                total: sql<number>`count(*)::int`,
                pending: sql<number>`count(*) filter (where ${task.status} = 'pending')::int`,
                inProgress: sql<number>`count(*) filter (where ${task.status} = 'in_progress')::int`,
                completed: sql<number>`count(*) filter (where ${task.status} = 'completed')::int`,
                overdue: sql<number>`count(*) filter (where ${task.dueDate} < ${now} and ${task.status} in ('pending', 'in_progress'))::int`,
                dueToday: sql<number>`count(*) filter (where ${task.dueDate} >= ${today} and ${task.dueDate} < ${tomorrow} and ${task.status} in ('pending', 'in_progress'))::int`,
                dueThisWeek: sql<number>`count(*) filter (where ${task.dueDate} >= ${today} and ${task.dueDate} < ${weekEnd} and ${task.status} in ('pending', 'in_progress'))::int`,
            })
            .from(task)
            .where(and(eq(task.organizationId, organizationId), eq(task.isActive, true)));

        return stats[0];
    },

    async getTasksByOwner(organizationId: string, ownerId: string): Promise<TaskSelect[]> {
        return db.query.task.findMany({
            where: and(
                eq(task.organizationId, organizationId),
                eq(task.ownerId, ownerId),
                eq(task.isActive, true)
            ),
        });
    },

    async assignOwner(taskId: string, organizationId: string, ownerId: string): Promise<TaskSelect> {
        const [updated] = await db
            .update(task)
            .set({ ownerId, updatedAt: new Date() })
            .where(and(eq(task.id, taskId), eq(task.organizationId, organizationId)))
            .returning();

        if (!updated) {
            throw new Error('Task not found');
        }

        return updated;
    },

    // ============== Legacy User-scoped Methods (for backwards compatibility) ==============

    async createTaskLegacy(
        userId: string,
        data: Omit<TaskInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<TaskSelect> {
        const id = nanoid();
        const now = new Date();

        const [newTask] = await db
            .insert(task)
            .values({
                id,
                userId,
                ...data,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return newTask;
    },

    async getTaskById(taskId: string, userId: string): Promise<TaskWithRelations> {
        const result = await db.query.task.findFirst({
            where: and(eq(task.id, taskId), eq(task.userId, userId), eq(task.isActive, true)),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
                assignedTo: {
                    columns: { id: true, name: true, email: true },
                },
            },
        });

        if (!result) {
            throw new Error('Task not found');
        }

        return result;
    },

    async getUserTasks(
        userId: string,
        options: PaginationOptions & {
            status?: string;
            priority?: string;
            type?: string;
            companyId?: string;
            contactId?: string;
            dealId?: string;
            dueBefore?: string;
            dueAfter?: string;
            overdue?: boolean;
        } = {}
    ): Promise<PaginatedResult<TaskWithRelations>> {
        const {
            page = 1,
            pageSize = 20,
            sortBy = 'dueDate',
            sortOrder = 'asc',
            status,
            priority,
            type,
            companyId,
            contactId,
            dealId,
            dueBefore,
            dueAfter,
            overdue,
        } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(task.userId, userId), eq(task.isActive, true)];

        if (status) conditions.push(eq(task.status, status as any));
        if (priority) conditions.push(eq(task.priority, priority as any));
        if (type) conditions.push(eq(task.type, type as any));
        if (companyId) conditions.push(eq(task.companyId, companyId));
        if (contactId) conditions.push(eq(task.contactId, contactId));
        if (dealId) conditions.push(eq(task.dealId, dealId));
        if (dueBefore) conditions.push(lte(task.dueDate, new Date(dueBefore)));
        if (dueAfter) conditions.push(gte(task.dueDate, new Date(dueAfter)));
        if (overdue) {
            conditions.push(lt(task.dueDate, new Date()));
            conditions.push(
                or(eq(task.status, 'pending'), eq(task.status, 'in_progress'))!
            );
        }

        const orderDirection = sortOrder === 'asc' ? asc : desc;
        const orderByColumn = sortBy === 'name' ? task.title : task[sortBy as keyof typeof task] || task.dueDate;

        const [tasks, countResult] = await Promise.all([
            db.query.task.findMany({
                where: and(...conditions),
                with: {
                    company: {
                        columns: { id: true, name: true },
                    },
                    contact: {
                        columns: { id: true, firstName: true, lastName: true },
                    },
                    deal: {
                        columns: { id: true, name: true },
                    },
                    assignedTo: {
                        columns: { id: true, name: true, email: true },
                    },
                },
                orderBy: [orderDirection(orderByColumn as any)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(task)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: tasks,
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

    async getUpcomingTasks(userId: string, days: number = 7): Promise<TaskWithRelations[]> {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const tasks = await db.query.task.findMany({
            where: and(
                eq(task.userId, userId),
                eq(task.isActive, true),
                or(eq(task.status, 'pending'), eq(task.status, 'in_progress')),
                gte(task.dueDate, now),
                lte(task.dueDate, futureDate)
            ),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
            },
            orderBy: [asc(task.dueDate)],
            limit: 50,
        });

        return tasks;
    },

    async getOverdueTasks(userId: string): Promise<TaskWithRelations[]> {
        const now = new Date();

        const tasks = await db.query.task.findMany({
            where: and(
                eq(task.userId, userId),
                eq(task.isActive, true),
                or(eq(task.status, 'pending'), eq(task.status, 'in_progress')),
                lt(task.dueDate, now)
            ),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                contact: {
                    columns: { id: true, firstName: true, lastName: true },
                },
                deal: {
                    columns: { id: true, name: true },
                },
            },
            orderBy: [asc(task.dueDate)],
        });

        return tasks;
    },

    async updateTask(
        taskId: string,
        userId: string,
        data: Partial<Omit<TaskInsert, 'id' | 'userId' | 'createdAt'>>
    ): Promise<TaskSelect> {
        const [updatedTask] = await db
            .update(task)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(task.id, taskId), eq(task.userId, userId)))
            .returning();

        if (!updatedTask) {
            throw new Error('Task not found');
        }

        return updatedTask;
    },

    async completeTask(taskId: string, userId: string): Promise<TaskSelect> {
        const now = new Date();

        const [completedTask] = await db
            .update(task)
            .set({
                status: 'completed',
                completedAt: now,
                updatedAt: now,
            })
            .where(and(eq(task.id, taskId), eq(task.userId, userId)))
            .returning();

        if (!completedTask) {
            throw new Error('Task not found');
        }

        return completedTask;
    },

    async deleteTask(taskId: string, userId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(task)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(task.id, taskId), eq(task.userId, userId)))
            .returning();

        if (!deleted) {
            throw new Error('Task not found');
        }

        return { success: true };
    },

    async getTaskStats(userId: string): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        overdue: number;
        dueToday: number;
        dueThisWeek: number;
    }> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const stats = await db
            .select({
                total: sql<number>`count(*)::int`,
                pending: sql<number>`count(*) filter (where ${task.status} = 'pending')::int`,
                inProgress: sql<number>`count(*) filter (where ${task.status} = 'in_progress')::int`,
                completed: sql<number>`count(*) filter (where ${task.status} = 'completed')::int`,
                overdue: sql<number>`count(*) filter (where ${task.dueDate} < ${now} and ${task.status} in ('pending', 'in_progress'))::int`,
                dueToday: sql<number>`count(*) filter (where ${task.dueDate} >= ${today} and ${task.dueDate} < ${tomorrow} and ${task.status} in ('pending', 'in_progress'))::int`,
                dueThisWeek: sql<number>`count(*) filter (where ${task.dueDate} >= ${today} and ${task.dueDate} < ${weekEnd} and ${task.status} in ('pending', 'in_progress'))::int`,
            })
            .from(task)
            .where(and(eq(task.userId, userId), eq(task.isActive, true)));

        return stats[0];
    },
};
