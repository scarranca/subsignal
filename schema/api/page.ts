import { z } from 'zod';

export const createPageSchema = z.object({
    page: z.object({
        title: z.string().min(1),
        url: z.string().url(),
    }),
    company: z
        .object({
            id: z.string().uuid().optional(),
            name: z.string().min(1).optional(),
            url: z.string().url().optional(),
        })
        .refine(
            (data) => {
                // Either provide id (existing company) OR name+url (new company)
                const hasId = !!data.id;
                const hasNameAndUrl = !!data.name && !!data.url;
                return hasId || hasNameAndUrl;
            },
            {
                message:
                    "Either provide company 'id' for existing company, or both 'name' and 'url' for new company",
            },
        ),
});

export const updatePageSchema = z.object({
    title: z.string().min(1).optional(),
    url: z.string().url().optional(),
});

export const bulkDeletePagesSchema = z.object({
    pageIds: z.array(z.string().uuid()).min(1),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type BulkDeletePagesInput = z.infer<typeof bulkDeletePagesSchema>;
