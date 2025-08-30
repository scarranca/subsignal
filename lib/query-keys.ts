/**
 * Centralized query keys for TanStack Query
 * This prevents cache key mismatches and ensures consistency
 */

export const queryKeys = {
    companies: (params?: {
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
    }) => (params ? ['companies', params] : ['companies']),

    preferences: () => ['preferences'],

    // Add more query keys as needed
    pages: (companyId?: string) => (companyId ? ['pages', { companyId }] : ['pages']),

    paymentStatus: () => ['paymentStatus'],

    briefings: (params?: {
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
    }) => (params ? ['briefings', params] : ['briefings']),
} as const;
