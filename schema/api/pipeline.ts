import { z } from 'zod';

export const pipelineStageSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
    probability: z.number().min(0).max(100).default(0),
    position: z.number().min(0),
    isWonStage: z.boolean().default(false),
    isLostStage: z.boolean().default(false),
});

export const createPipelineSchema = z.object({
    name: z.string().min(1, 'Pipeline name is required').max(100),
    description: z.string().max(500).optional(),
    isDefault: z.boolean().default(false),
    stages: z.array(pipelineStageSchema).min(1, 'At least one stage is required'),
});

export const updatePipelineSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isDefault: z.boolean().optional(),
});

export const updatePipelineStageSchema = pipelineStageSchema.partial().extend({
    id: z.string().optional(),
});

export const reorderStagesSchema = z.object({
    stages: z.array(z.object({
        id: z.string(),
        position: z.number().min(0),
    })),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type PipelineStageInput = z.infer<typeof pipelineStageSchema>;
