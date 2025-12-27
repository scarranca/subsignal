import { z } from 'zod';

export const interactionTypeSchema = z.enum(['call', 'email', 'meeting', 'note', 'linkedin_message', 'text_message', 'other']);
export const interactionDirectionSchema = z.enum(['inbound', 'outbound']);
export const interactionOutcomeSchema = z.enum(['positive', 'neutral', 'negative', 'no_answer', 'left_voicemail', 'scheduled_followup']);

export const createInteractionSchema = z.object({
    type: interactionTypeSchema,
    direction: interactionDirectionSchema.optional(),
    outcome: interactionOutcomeSchema.optional(),
    subject: z.string().max(500).optional(),
    content: z.string().max(50000).optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    occurredAt: z.string().datetime().optional(),
    duration: z.number().min(0).optional(), // Duration in minutes
});

export const updateInteractionSchema = createInteractionSchema.partial();

export const interactionFilterSchema = z.object({
    type: interactionTypeSchema.optional(),
    direction: interactionDirectionSchema.optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    dealId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
export type UpdateInteractionInput = z.infer<typeof updateInteractionSchema>;
export type InteractionFilterInput = z.infer<typeof interactionFilterSchema>;
