export type PlanType = 'solo_plan' | 'team_plan';

export interface PlanFeature {
    text: string;
    included?: boolean;
}

export interface PricingPlan {
    id: PlanType;
    name: string;
    price: string;
    period: string;
    description: string;
    features: PlanFeature[];
}

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

// Plan ID mapping for API calls
export const PLAN_ID_MAPPING = {
    solo_plan: 'solo',
    team_plan: 'team',
} as const;

// Dodo Payments product ID mapping for overlay checkout
// Replace these with your actual product IDs from Dodo Payments dashboard
export const DODO_PRODUCT_ID_MAPPING = {
    solo_plan: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || 'pdt_your_solo_product_id',
    team_plan: process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID || 'pdt_your_team_product_id',
} as const;
