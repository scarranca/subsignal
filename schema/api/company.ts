import { z } from 'zod';
import { tolerantUrlSchema } from './common';

export const createCompanySchema = z.object({
    company: z.object({
        name: z.string().min(1),
        url: tolerantUrlSchema,
    }),
    page: z.object({
        title: z.string().min(1).optional(), // Optional since we auto-fetch it
        url: tolerantUrlSchema,
    }),
});

export const updateCompanySchema = z.object({
    name: z.string().min(1).optional(),
    url: tolerantUrlSchema.optional(),
});

export const batchCreateCompaniesSchema = z.object({
    urls: z.array(tolerantUrlSchema).min(1).max(50), // Allow 1-50 URLs
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type BatchCreateCompaniesInput = z.infer<typeof batchCreateCompaniesSchema>;
