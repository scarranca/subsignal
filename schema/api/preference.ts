import { z } from 'zod';

export const updatePreferenceSchema = z.object({
    properties: z.array(
        z.enum(['pricing', 'product', 'customer', 'partnership', 'branding', 'messaging']),
    ),
    frequency: z.enum(['3_day', '7_day', '15_day', '1_month', '3_month', '6_month']),
});

export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;
