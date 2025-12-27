import {
    BillingPlan,
    AvailableBillingPlan,
    BillingEntitlement,
    BillingSelect,
} from '@/db/schema/billing';

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
 * CRM Pricing Plans
 */
export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'solo_plan_monthly',
        name: 'Starter',
        price: '$49',
        period: '/month',
        description: 'For solo founders and small sales teams',
        features: [
            { text: 'Up to 500 contacts', included: true },
            { text: 'Up to 100 deals', included: true },
            { text: 'Unlimited interactions', included: true },
            { text: 'AI-powered insights', included: true },
            { text: 'Email integration', included: true },
            { text: 'Task management', included: true },
            { text: 'Activity timeline', included: true },
            { text: 'Team collaboration', included: false },
        ],
        ctaText: 'Start Free Trial',
    },
    {
        id: 'team_plan_monthly',
        name: 'Professional',
        price: '$99',
        period: '/month',
        description: 'For growing teams and businesses',
        features: [
            { text: 'Up to 5,000 contacts', included: true },
            { text: 'Up to 1,000 deals', included: true },
            { text: 'Unlimited interactions', included: true },
            { text: 'Advanced AI insights', included: true },
            { text: 'Email & calendar sync', included: true },
            { text: 'Custom pipelines', included: true },
            { text: 'Custom fields', included: true },
            { text: 'Priority support', included: true },
        ],
        ctaText: 'Start Free Trial',
        isPopular: true,
    },
    {
        id: 'solo_plan_annually',
        name: 'Starter',
        price: '$39',
        period: '/month',
        description: 'For solo founders and small sales teams (billed annually)',
        features: [
            { text: 'Up to 500 contacts', included: true },
            { text: 'Up to 100 deals', included: true },
            { text: 'Unlimited interactions', included: true },
            { text: 'AI-powered insights', included: true },
            { text: 'Email integration', included: true },
            { text: 'Task management', included: true },
            { text: 'Activity timeline', included: true },
            { text: 'Team collaboration', included: false },
        ],
        ctaText: 'Start Free Trial',
    },
    {
        id: 'team_plan_annually',
        name: 'Professional',
        price: '$79',
        period: '/month',
        description: 'For growing teams and businesses (billed annually)',
        features: [
            { text: 'Up to 5,000 contacts', included: true },
            { text: 'Up to 1,000 deals', included: true },
            { text: 'Unlimited interactions', included: true },
            { text: 'Advanced AI insights', included: true },
            { text: 'Email & calendar sync', included: true },
            { text: 'Custom pipelines', included: true },
            { text: 'Custom fields', included: true },
            { text: 'Priority support', included: true },
        ],
        ctaText: 'Start Free Trial',
        isPopular: true,
    },
    {
        id: 'custom_plan',
        name: 'Enterprise',
        price: 'Custom',
        period: '/month',
        description: 'For large organizations with advanced needs',
        features: [
            { text: 'Unlimited contacts', included: true },
            { text: 'Unlimited deals', included: true },
            { text: 'Unlimited team members', included: true },
            { text: 'Enterprise AI features', included: true },
            { text: 'Custom integrations', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'SSO & SAML', included: true },
            { text: 'Dedicated success manager', included: true },
            { text: 'SLA guarantee', included: true },
        ],
        ctaText: 'Contact Sales',
        isEnterprise: true,
    },
];

/**
 * Get the contact limit for a given plan
 */
export function getContactLimit(plan: BillingPlan): number {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return 500;
        case 'team_plan_monthly':
        case 'team_plan_annually':
            return 5000;
        case 'custom_plan':
            return 100000; // Proxy for unlimited
    }
    return 100;
}

/**
 * Get the deal limit for a given plan
 */
export function getDealLimit(plan: BillingPlan): number {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return 100;
        case 'team_plan_monthly':
        case 'team_plan_annually':
            return 1000;
        case 'custom_plan':
            return 50000; // Proxy for unlimited
    }
    return 50;
}

/**
 * Get the page limit for a given plan (legacy - for monitoring feature)
 */
export function getPageLimit(plan: BillingPlan): number {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return 50;
        case 'team_plan_monthly':
        case 'team_plan_annually':
            return 100;
        case 'custom_plan':
            return 1000;
    }
    return 10;
}

/**
 * Get the company limit for a given plan
 */
export function getCompanyLimit(plan: BillingPlan): number {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return 100;
        case 'team_plan_monthly':
        case 'team_plan_annually':
            return 500;
        case 'custom_plan':
            return 10000;
    }
    return 50;
}

/**
 * Get the briefing limit for a given plan (legacy - for monitoring feature)
 */
export function getBriefingLimit(plan: BillingPlan): number {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return 4;
        case 'team_plan_monthly':
        case 'team_plan_annually':
            return 8;
        case 'custom_plan':
            return 12;
    }
    return 4;
}

/**
 * Get the refresh limit for a given plan (legacy - for monitoring feature)
 */
export function getRefreshLimit(plan: BillingPlan): '3_day' | '7_day' {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return '3_day';
        case 'team_plan_monthly':
        case 'team_plan_annually':
            return '3_day';
        case 'custom_plan':
            return '3_day';
    }
    return '7_day';
}

/**
 * Get if AI features are enabled for a given plan
 */
export function getAIEnabled(plan: BillingPlan): boolean {
    return true; // AI is enabled for all plans
}

/**
 * Get if advanced AI features are enabled for a given plan
 */
export function getAdvancedAIEnabled(plan: BillingPlan): boolean {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return false;
        case 'team_plan_monthly':
        case 'team_plan_annually':
        case 'custom_plan':
            return true;
    }
    return false;
}

/**
 * Get the zapier enabled for a given plan
 */
function getZapierEnabled(plan: BillingPlan): boolean {
    switch (plan) {
        case 'solo_plan_monthly':
        case 'solo_plan_annually':
            return false;
        case 'team_plan_monthly':
        case 'team_plan_annually':
        case 'custom_plan':
            return true;
    }
    return false;
}

/**
 * Get the email enabled for a given plan
 */
function getEmailEnabled(plan: BillingPlan): boolean {
    return true; // Email is enabled for all plans
}

/**
 * Get the billing entitlement for a given record
 */
export function getBillingEntitlement(record: BillingSelect): BillingEntitlement {
    const plan = record.currentPlan || 'solo_plan_monthly';

    return {
        ...record,
        currentPlan: plan,
        pageLimit: getPageLimit(plan),
        companyLimit: getCompanyLimit(plan),
        briefingLimit: getBriefingLimit(plan),
        refreshLimit: getRefreshLimit(plan),
        zapierEnabled: getZapierEnabled(plan),
        emailEnabled: getEmailEnabled(plan),
    };
}

/**
 * Plan ID mapping for API calls
 */
export const PLAN_ID_MAPPING: Record<AvailableBillingPlan, AvailableBillingPlan> = {
    solo_plan_monthly: 'solo_plan_monthly',
    team_plan_monthly: 'team_plan_monthly',
    solo_plan_annually: 'solo_plan_annually',
    team_plan_annually: 'team_plan_annually',
} as const;

/**
 * Dodo Payments product ID mapping for overlay checkout
 */
export const DODO_PRODUCT_ID_MAPPING: Record<AvailableBillingPlan, string> = {
    solo_plan_monthly:
        process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID_MONTHLY || 'pdt_your_solo_product_id',
    solo_plan_annually:
        process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID_ANNUALLY || 'pdt_your_solo_product_id',
    team_plan_monthly:
        process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID_MONTHLY || 'pdt_your_team_product_id',
    team_plan_annually:
        process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID_ANNUALLY || 'pdt_your_team_product_id',
} as const;

/**
 * Get the plan type from a Dodo product ID
 */
export function getPlanFromProductId(productId: string): BillingPlan {
    const reverseMapping: Record<string, keyof typeof PLAN_ID_MAPPING> = {};
    for (const [planType, id] of Object.entries(DODO_PRODUCT_ID_MAPPING)) {
        reverseMapping[id] = planType as keyof typeof PLAN_ID_MAPPING;
    }

    return reverseMapping[productId] || 'custom_plan';
}

/**
 * Get the Dodo product ID for a given plan ID
 */
export function getDodoProductIdFromPlanId(planId?: BillingPlan): string | null {
    if (!planId) {
        return null;
    }

    if (isPlanAvailable(planId)) {
        return DODO_PRODUCT_ID_MAPPING[planId];
    }

    return null;
}

/**
 * Check if a plan is available for purchase
 */
export function isPlanAvailable(planId: BillingPlan): planId is AvailableBillingPlan {
    return planId !== 'custom_plan';
}

/**
 * Get available plans for display
 */
export function getAvailablePlans(): PricingPlan[] {
    return PRICING_PLANS.filter((plan) => isPlanAvailable(plan.id));
}
