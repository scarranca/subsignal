import { z } from 'zod';

const createPageWithExistingCompanySchema = z.object({
    title: z.string().min(1),
    url: z.string().url(),
    companyId: z.string().uuid(),
});

const createPageWithNewCompanySchema = z.object({
    title: z.string().min(1),
    url: z.string().url(),
    newCompany: z.object({
        name: z.string().min(1),
        url: z.string().url(),
    }),
});

export const createPageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('existing'),
        ...createPageWithExistingCompanySchema.shape,
    }),
    z.object({
        type: z.literal('new'),
        ...createPageWithNewCompanySchema.shape,
    }),
]);

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