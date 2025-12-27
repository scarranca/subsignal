import { z } from 'zod';

export const activityEntityTypeSchema = z.enum(['company', 'contact', 'deal', 'interaction', 'task', 'pipeline']);
export const activityActionSchema = z.enum([
    'created', 'updated', 'deleted', 'restored',
    'stage_changed', 'status_changed', 'assigned', 'unassigned',
    'commented', 'mentioned', 'email_sent', 'email_received',
    'call_made', 'call_received', 'meeting_scheduled', 'meeting_completed',
    'deal_won', 'deal_lost', 'task_completed'
]);

export const activityFilterSchema = z.object({
    entityType: activityEntityTypeSchema.optional(),
    entityId: z.string().optional(),
    action: activityActionSchema.optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;
