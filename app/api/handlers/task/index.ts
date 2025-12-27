import { Context } from 'hono';
import { taskQueries, activityQueries } from '@/db/queries';
import { createTaskSchema, updateTaskSchema, taskFilterSchema, paginationSchema } from '@/schema/api';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';

export async function handleGetTasks(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const pagination = paginationSchema.parse(query);
        const filters = taskFilterSchema.parse(query);

        const result = await taskQueries.getUserTasks(user.id, {
            ...pagination,
            ...filters,
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching tasks:', error);
        return c.json({ error: 'Failed to fetch tasks' }, 500);
    }
}

export async function handleGetTask(c: Context) {
    try {
        const user = getUser(c);
        const taskId = c.req.param('id');

        if (!taskId) {
            return c.json({ error: 'Task ID is required' }, 400);
        }

        const result = await taskQueries.getTaskById(taskId, user.id);
        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Task not found') {
            return c.json({ error: 'Task not found' }, 404);
        }
        console.error('Error fetching task:', error);
        return c.json({ error: 'Failed to fetch task' }, 500);
    }
}

export async function handleGetUpcomingTasks(c: Context) {
    try {
        const user = getUser(c);
        const days = parseInt(c.req.query('days') || '7', 10);

        const tasks = await taskQueries.getUpcomingTasks(user.id, days);
        return c.json({ data: tasks });
    } catch (error) {
        console.error('Error fetching upcoming tasks:', error);
        return c.json({ error: 'Failed to fetch upcoming tasks' }, 500);
    }
}

export async function handleGetOverdueTasks(c: Context) {
    try {
        const user = getUser(c);
        const tasks = await taskQueries.getOverdueTasks(user.id);
        return c.json({ data: tasks });
    } catch (error) {
        console.error('Error fetching overdue tasks:', error);
        return c.json({ error: 'Failed to fetch overdue tasks' }, 500);
    }
}

export async function handleCreateTask(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createTaskSchema.parse(body);

        const task = await taskQueries.createTask(user.id, {
            title: validatedData.title,
            description: validatedData.description || null,
            type: validatedData.type,
            priority: validatedData.priority,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
            reminderAt: validatedData.reminderAt ? new Date(validatedData.reminderAt) : null,
            companyId: validatedData.companyId || null,
            contactId: validatedData.contactId || null,
            dealId: validatedData.dealId || null,
            assignedToId: validatedData.assignedToId || null,
            tags: validatedData.tags || null,
        });

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'task',
            entityId: task.id,
            entityName: task.title,
            action: 'created',
            description: `Created task "${task.title}"`,
            relatedCompanyId: task.companyId || undefined,
            relatedContactId: task.contactId || undefined,
            relatedDealId: task.dealId || undefined,
        });

        return c.json(task, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error creating task:', error);
        return c.json({ error: 'Failed to create task' }, 500);
    }
}

export async function handleUpdateTask(c: Context) {
    try {
        const user = getUser(c);
        const taskId = c.req.param('id');
        const body = await c.req.json();

        if (!taskId) {
            return c.json({ error: 'Task ID is required' }, 400);
        }

        const validatedData = updateTaskSchema.parse(body);

        // Convert dates if present
        const updateData: any = { ...validatedData };
        if (validatedData.dueDate) {
            updateData.dueDate = new Date(validatedData.dueDate);
        }
        if (validatedData.reminderAt) {
            updateData.reminderAt = new Date(validatedData.reminderAt);
        }
        if (validatedData.completedAt) {
            updateData.completedAt = new Date(validatedData.completedAt);
        }

        const updatedTask = await taskQueries.updateTask(taskId, user.id, updateData);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'task',
            entityId: updatedTask.id,
            entityName: updatedTask.title,
            action: 'updated',
            description: `Updated task "${updatedTask.title}"`,
            changes: { after: validatedData },
            relatedCompanyId: updatedTask.companyId || undefined,
            relatedContactId: updatedTask.contactId || undefined,
            relatedDealId: updatedTask.dealId || undefined,
        });

        return c.json(updatedTask);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Task not found') {
            return c.json({ error: 'Task not found' }, 404);
        }
        console.error('Error updating task:', error);
        return c.json({ error: 'Failed to update task' }, 500);
    }
}

export async function handleCompleteTask(c: Context) {
    try {
        const user = getUser(c);
        const taskId = c.req.param('id');

        if (!taskId) {
            return c.json({ error: 'Task ID is required' }, 400);
        }

        const completedTask = await taskQueries.completeTask(taskId, user.id);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'task',
            entityId: completedTask.id,
            entityName: completedTask.title,
            action: 'task_completed',
            description: `Completed task "${completedTask.title}"`,
            relatedCompanyId: completedTask.companyId || undefined,
            relatedContactId: completedTask.contactId || undefined,
            relatedDealId: completedTask.dealId || undefined,
        });

        return c.json(completedTask);
    } catch (error) {
        if (error instanceof Error && error.message === 'Task not found') {
            return c.json({ error: 'Task not found' }, 404);
        }
        console.error('Error completing task:', error);
        return c.json({ error: 'Failed to complete task' }, 500);
    }
}

export async function handleDeleteTask(c: Context) {
    try {
        const user = getUser(c);
        const taskId = c.req.param('id');

        if (!taskId) {
            return c.json({ error: 'Task ID is required' }, 400);
        }

        // Get task before deletion for activity log
        const task = await taskQueries.getTaskById(taskId, user.id);

        const result = await taskQueries.deleteTask(taskId, user.id);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'task',
            entityId: taskId,
            entityName: task.title,
            action: 'deleted',
            description: `Deleted task "${task.title}"`,
            relatedCompanyId: task.companyId || undefined,
            relatedContactId: task.contactId || undefined,
            relatedDealId: task.dealId || undefined,
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Task not found') {
            return c.json({ error: 'Task not found' }, 404);
        }
        console.error('Error deleting task:', error);
        return c.json({ error: 'Failed to delete task' }, 500);
    }
}

export async function handleGetTaskStats(c: Context) {
    try {
        const user = getUser(c);
        const stats = await taskQueries.getTaskStats(user.id);
        return c.json(stats);
    } catch (error) {
        console.error('Error fetching task stats:', error);
        return c.json({ error: 'Failed to fetch task stats' }, 500);
    }
}
