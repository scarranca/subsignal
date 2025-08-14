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

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
