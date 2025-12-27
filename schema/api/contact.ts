import { z } from 'zod';

export const contactStatusSchema = z.enum(['active', 'inactive', 'archived']);
export const contactSourceSchema = z.enum(['manual', 'import', 'linkedin', 'referral', 'website', 'email', 'other']);

export const createContactSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(50).optional(),
    title: z.string().max(200).optional(),
    department: z.string().max(100).optional(),
    companyId: z.string().optional(),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    twitterUrl: z.string().url().optional().or(z.literal('')),
    status: contactStatusSchema.default('active'),
    source: contactSourceSchema.default('manual'),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    notes: z.string().max(10000).optional(),
    customFields: z.record(z.unknown()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactFilterSchema = z.object({
    status: contactStatusSchema.optional(),
    source: contactSourceSchema.optional(),
    companyId: z.string().optional(),
    search: z.string().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFilterInput = z.infer<typeof contactFilterSchema>;
