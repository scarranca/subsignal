import { z } from 'zod';
import { normalizeUrl, isValidUrl } from '@/lib/url';

// Tolerant URL schema that normalizes URLs by adding https:// if missing
export const tolerantUrlSchema = z.string().transform((val) => {
    const normalized = normalizeUrl(val);
    if (!isValidUrl(normalized)) {
        throw new z.ZodError([
            {
                code: 'custom',
                message: 'Invalid URL format',
                path: [],
            },
        ]);
    }
    return normalized;
});

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'title']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
