import { z } from 'zod';

// Briefing creation schema
export const createBriefingSchema = z.object({
    companyId: z.string().min(1, 'Company ID is required'),
    companyUrl: z.string().url('Valid company URL is required'),
    briefing: z.string().min(1, 'Briefing content is required'),
});

// Briefing update schema
export const updateBriefingSchema = z.object({
    briefing: z.string().min(1, 'Briefing content is required'),
});

// Briefing query parameters schema
export const briefingQuerySchema = z.object({
    companyId: z.string().optional(),
    limit: z.number().int().positive().max(100).default(10),
    offset: z.number().int().min(0).default(0),
});

// Schema for OpenAI structured output per category
export const CategorySummarySchema = z.object({
    category: z.string().describe('The competitive category being analyzed'),
    summary: z
        .string()
        .describe(
            '2-3 sentence overview of the main themes and strategic implications for this category',
        ),
    changes: z
        .array(
            z.object({
                text: z
                    .string()
                    .describe(
                        'Single punchy sentence explaining what changed and why it matters - Morning Brew style',
                    ),
                urls: z
                    .array(z.string())
                    .describe('All URLs where this change pattern was observed'),
            }),
        )
        .describe(
            'Array of strategic changes, each combining related observations across multiple URLs',
        ),
});

export type CreateBriefingRequest = z.infer<typeof createBriefingSchema>;
export type UpdateBriefingRequest = z.infer<typeof updateBriefingSchema>;
export type BriefingQueryParams = z.infer<typeof briefingQuerySchema>;
export type CategorySummary = z.infer<typeof CategorySummarySchema>;
