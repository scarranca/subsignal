import type { DiffProperty } from '@/types/diff/content';

/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES = {
    properties: ['pricing', 'product', 'customer', 'partnership'] as DiffProperty[],
    frequency: '15_day' as const,
};

export const ALL_DIFF_PROPERTIES: DiffProperty[] = [
    'pricing',
    'product',
    'customer',
    'partnership',
    'branding',
    'messaging',
];
