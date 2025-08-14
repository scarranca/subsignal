import { z } from 'zod';

export const createCompanySchema = z.object({
    company: z.object({
        name: z.string().min(1),
        url: z.string().url(),
    }),
    page: z.object({
        title: z.string().min(1),
        url: z.string().url(),
    }),
});

export const updateCompanySchema = z.object({
    name: z.string().min(1).optional(),
    url: z.string().url().optional(),
});

export const batchCreateCompaniesSchema = z.object({
    urls: z.array(z.string().url()).min(1).max(50), // Allow 1-50 URLs
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type BatchCreateCompaniesInput = z.infer<typeof batchCreateCompaniesSchema>;
