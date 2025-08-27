// import { DodoWebhookPayload } from '@/types/dodo';

export type PlanType = 'solo_plan' | 'team_plan';

/**
 * Plan feature
 */
export interface PlanFeature {
    text: string;
    included?: boolean;
}

/**
 * Pricing plan
 */
export interface PricingPlan {
    id: PlanType;
    name: string;
    price: string;
    period: string;
    description: string;
    features: PlanFeature[];
}

/**
 * Pricing plans
 */
export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'solo_plan',
        name: 'Solo',
        price: '$99',
        period: '/month',
        description: 'For individual VCs tracking their deal flow',
        features: [
            { text: 'Track up to 10 companies' },
            { text: 'Monitor up to 50 pages' },
            { text: 'Refresh every 15 days' },
            { text: 'Email integration' },
            { text: 'CRM integration (Affinity, AngelList)', included: false },
        ],
    },
    {
        id: 'team_plan',
        name: 'Team',
        price: '$299',
        period: '/month',
        description: 'For investment teams and small funds',
        features: [
            { text: 'Track up to 50 companies' },
            { text: 'Monitor up to 100 pages' },
            { text: 'Refresh every 7 days' },
            { text: 'Email & Slack integrations' },
            { text: 'CRM integrations (Affinity, AngelList)' },
            { text: 'Up to 10 seats' },
            { text: 'Dedicated success manager' },
        ],
    },
];

/**
 * Plan ID mapping for API calls
 */
export const PLAN_ID_MAPPING = {
    solo_plan: 'solo_plan',
    team_plan: 'team_plan',
} as const;

/**
 * Dodo Payments product ID mapping for overlay checkout
 * Replace these with your actual product IDs from Dodo Payments dashboard
 */
export const DODO_PRODUCT_ID_MAPPING = {
    solo_plan: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || 'pdt_your_solo_product_id',
    team_plan: process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID || 'pdt_your_team_product_id',
} as const;

/**
 * Get the plan type from a Dodo product ID
 * @param productId
 * @returns
 */
export function getPlanFromProductId(
    productId: string,
): 'solo_plan' | 'team_plan' | 'enterprise_plan' {
    const reverseMapping: Record<string, keyof typeof PLAN_ID_MAPPING> = {};
    for (const [planType, id] of Object.entries(DODO_PRODUCT_ID_MAPPING)) {
        reverseMapping[id] = planType as keyof typeof PLAN_ID_MAPPING;
    }

    // If the product id is not in the mapping, return enterprise plan
    // These are custom plans that are not available in the pricing page
    return reverseMapping[productId] || 'enterprise_plan';
}

/**
 * Get the Dodo product ID for a given plan ID
 * @param planId
 * @returns
 */
export function getDodoProductIdFromPlanId(planId?: PlanType): string | null {
    if (!planId) {
        return null;
    }
    return DODO_PRODUCT_ID_MAPPING[planId] ?? null;
}
