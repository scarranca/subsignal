import { BillingPlan, AvailableBillingPlan } from '@/db/schema/billing';

/**
 * Plan feature
 */
export interface PlanFeature {
    text: string;
    included?: boolean;
}

export type Period = '/month' | '/year';

/**
 * Pricing plan
 */
export interface PricingPlan {
    id: BillingPlan;
    name: string;
    price: string;
    period: Period;
    description: string;
    features: PlanFeature[];
    ctaText: string;
    isPopular?: boolean;
    isEnterprise?: boolean;
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
            { text: 'Track up to 10 companies', included: true },
            { text: 'Monitor up to 50 pages', included: true },
            { text: 'Refresh every 15 days', included: true },
            { text: 'Email integration', included: true },
            { text: 'CRM integration (Affinity, AngelList)', included: false },
        ],
        ctaText: 'Start Tracking',
    },
    {
        id: 'team_plan',
        name: 'Team',
        price: '$299',
        period: '/month',
        description: 'For investment teams and small funds',
        features: [
            { text: 'Track up to 50 companies', included: true },
            { text: 'Monitor up to 100 pages', included: true },
            { text: 'Refresh every 7 days', included: true },
            { text: 'Email & Slack integrations', included: true },
            { text: 'CRM integrations (Affinity, AngelList)', included: true },
            { text: 'Up to 10 seats', included: true },
            { text: 'Dedicated success manager', included: true },
        ],
        ctaText: 'Contact Sales',
        isPopular: true,
    },
    {
        id: 'custom_plan',
        name: 'Fund',
        price: 'Custom',
        period: '/month',
        description: 'For large funds with extensive deal flow',
        features: [
            { text: 'Unlimited company tracking', included: true },
            { text: 'Unlimited page monitoring', included: true },
            { text: 'Unlimited seats', included: true },
            { text: 'Refresh every 3 days', included: true },
            { text: 'All integrations', included: true },
            { text: 'Enterprise compliance (SOC2, GDPR)', included: true },
            { text: 'Dedicated success manager', included: true },
        ],
        ctaText: 'Contact Sales',
        isEnterprise: true,
    },
];

/**
 * Plan ID mapping for API calls
 */
export const PLAN_ID_MAPPING: Record<AvailableBillingPlan, AvailableBillingPlan> = {
    solo_plan: 'solo_plan',
    team_plan: 'team_plan',
} as const;

/**
 * Dodo Payments product ID mapping for overlay checkout
 * Replace these with your actual product IDs from Dodo Payments dashboard
 */
export const DODO_PRODUCT_ID_MAPPING: Record<AvailableBillingPlan, string> = {
    solo_plan: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || 'pdt_your_solo_product_id',
    team_plan: process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID || 'pdt_your_team_product_id',
} as const;

/**
 * Get the plan type from a Dodo product ID
 * @param productId
 * @returns
 */
export function getPlanFromProductId(productId: string): BillingPlan {
    const reverseMapping: Record<string, keyof typeof PLAN_ID_MAPPING> = {};
    for (const [planType, id] of Object.entries(DODO_PRODUCT_ID_MAPPING)) {
        reverseMapping[id] = planType as keyof typeof PLAN_ID_MAPPING;
    }

    // If the product id is not in the mapping, return enterprise plan
    // These are custom plans that are not available in the pricing page
    return reverseMapping[productId] || 'custom_plan';
}

/**
 * Get the Dodo product ID for a given plan ID
 * @param planId
 * @returns
 */
export function getDodoProductIdFromPlanId(planId?: BillingPlan): string | null {
    if (!planId) {
        return null;
    }

    // Only return product ID for available plans
    if (isPlanAvailable(planId)) {
        return DODO_PRODUCT_ID_MAPPING[planId];
    }

    return null;
}

/**
 * Check if a plan is available for purchase
 * @param planId
 * @returns
 */
export function isPlanAvailable(planId: BillingPlan): planId is AvailableBillingPlan {
    return planId !== 'custom_plan';
}

/**
 * Get available plans for display
 * @returns
 */
export function getAvailablePlans(): PricingPlan[] {
    return PRICING_PLANS.filter((plan) => isPlanAvailable(plan.id));
}
