import { z } from 'zod';

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const taskTypeSchema = z.enum(['call', 'email', 'meeting', 'follow_up', 'proposal', 'research', 'demo', 'other']);

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(500),
    description: z.string().max(5000).optional(),
    type: taskTypeSchema.default('other'),
    priority: taskPrioritySchema.default('medium'),
    dueDate: z.string().datetime().optional(),
    reminderAt: z.string().datetime().optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    assignedToId: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
    status: taskStatusSchema.optional(),
    completedAt: z.string().datetime().optional(),
});

export const taskFilterSchema = z.object({
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    type: taskTypeSchema.optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    dueBefore: z.string().datetime().optional(),
    dueAfter: z.string().datetime().optional(),
    overdue: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
