import { z } from 'zod';

export const dealPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const dealStatusSchema = z.enum(['open', 'won', 'lost', 'abandoned']);

export const createDealSchema = z.object({
    name: z.string().min(1, 'Deal name is required').max(200),
    description: z.string().max(5000).optional(),
    value: z.number().min(0).optional(),
    currency: z.string().length(3).default('USD'),
    probability: z.number().min(0).max(100).optional(),
    priority: dealPrioritySchema.default('medium'),
    pipelineId: z.string().min(1, 'Pipeline is required'),
    stageId: z.string().min(1, 'Stage is required'),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    expectedCloseDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.unknown()).optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
    status: dealStatusSchema.optional(),
    lostReason: z.string().max(1000).optional(),
    actualCloseDate: z.string().datetime().optional(),
});

export const moveDealSchema = z.object({
    stageId: z.string().min(1),
    position: z.number().min(0).optional(),
});

export const dealFilterSchema = z.object({
    pipelineId: z.string().optional(),
    stageId: z.string().optional(),
    status: dealStatusSchema.optional(),
    priority: dealPrioritySchema.optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    search: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type MoveDealInput = z.infer<typeof moveDealSchema>;
export type DealFilterInput = z.infer<typeof dealFilterSchema>;
