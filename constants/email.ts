import { BillingEntitlementStatus, BillingPlan } from '@/db/schema/billing';

/**
 * Email subjects for each subscription status
 */
export const SUBSCRIPTION_SUBJECTS = {
    active: 'Subsignal - Access Confirmed! You are in!',
    grace: "Subsignal - Oops! Let's get your subscription sorted",
    inactive: "Subsignal - We're keeping your spot warm till you're ready",
    default: 'Subsignal - Subscription Update',
} as const;

/**
 * Onboarding subject variations
 */
export const ONBOARDING_SUBJECTS = [
    "Subsignal - Welcome Aboard! Let's Get You Started",
    "Subsignal - Let's get you started",
    "Subsignal - Let's get started",
    "Subsignal - Let's Make Your First Move",
    "Subsignal - Discover What's Next",
    'Subsignal - Time to Dive In',
    'Subsignal - Ready, Set, Go',
    "Subsignal - We'll help you take the first step",
    "Subsignal - Let's do the onboarding thing",
    'Subsignal - No fluff, just getting started',
    'Subsignal - We know onboarding can be tiring, but we will keep it quick',
    "Subsignal - Let's get your account sorted",
    'Subsignal - One small step to get going',
    "Subsignal - Alright baby steps, let's get started",
] as const;

/**
 * Briefing subjects (original variations)
 */
export const BRIEFING_SUBJECTS = [
    'Briefing',
    'Intel',
    'Update',
    'Brief',
    'Report',
    'Analysis',
    'Insights',
    'Overview',
    'Summary',
    'Digest',
] as const;

/**
 * Get a subscription subject by status
 * @param status - The status of the subscription
 * @returns A subscription subject
 */
export const getSubscriptionSubject = (status: BillingEntitlementStatus): string => {
    return SUBSCRIPTION_SUBJECTS[status] || SUBSCRIPTION_SUBJECTS.default;
};

/**
 * Get a random briefing subject with company name
 * @param companyName - The name of the company
 * @returns A random briefing subject with company name
 */
export const getBriefingSubject = (companyName: string): string => {
    const randomSubject = BRIEFING_SUBJECTS[Math.floor(Math.random() * BRIEFING_SUBJECTS.length)];
    const dateString = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    return `${randomSubject} for ${companyName} - ${dateString}`;
};

/**
 * Get a random onboarding subject
 * @returns A random onboarding subject
 */
export const getOnboardingSubject = (): string => {
    return ONBOARDING_SUBJECTS[Math.floor(Math.random() * ONBOARDING_SUBJECTS.length)];
};

/**
 * Get a preview text for an acknowledgement email
 * @param status - The status of the subscription
 * @returns A preview text for an acknowledgement email
 */
export const getAcknowledgementPreviewText = (status: BillingEntitlementStatus) => {
    switch (status) {
        case 'active':
            return 'You made our nights and weekends worth it';
        case 'inactive':
            return "Your Spot's Still Warm. Let's Figure This Out Together";
        default:
            return 'An update on your subscription';
    }
};

/**
 * Get a title for an acknowledgement email
 * @param status - The status of the subscription
 * @returns A title for an acknowledgement email
 */
export const getAcknowledgementTitle = (status: BillingEntitlementStatus) => {
    switch (status) {
        case 'active':
            return 'You are in!';
        case 'inactive':
            return "We're Here When You're Ready";
        default:
            return 'Subscription Update';
    }
};

/**
 * Get a subtitle for an acknowledgement email
 * @param status - The status of the subscription
 * @returns A subtitle for an acknowledgement email
 */
export const getAcknowledgementSubtitle = (status: BillingEntitlementStatus) => {
    switch (status) {
        case 'active':
            return 'No, this is not a boring activation email';
        case 'inactive':
            return "Alright, let's get you back in";
        default:
            return 'An update on your subscription';
    }
};

/**
 * Format a date
 * @param date - The date to format
 * @returns A formatted date
 */
const formatDate = (date?: Date | null) =>
    date ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date) : '—';

/**
 * Get a formatted subscription start date
 * @param subscriptionStartedAt - The date the subscription started
 * @returns A formatted subscription start date
 */
export const getSubscriptionStartDate = (subscriptionStartedAt: Date | null | undefined) => {
    return formatDate(subscriptionStartedAt);
};

/**
 * Get a formatted current period end date
 * @param currentPeriodEnd - The date the current period ends
 * @returns A formatted current period end date
 */
export const getCurrentPeriodEnd = (currentPeriodEnd: Date | null | undefined) => {
    return formatDate(currentPeriodEnd);
};

/**
 * Get a formatted plan
 * @param plan - The plan to format
 * @returns A formatted plan
 */
export const formattedPlan = (plan: BillingPlan) => {
    switch (plan) {
        case 'solo_plan':
            return 'Subsignal - Solo Plan';
        case 'team_plan':
            return 'Subsignal - Team Plan';
        case 'custom_plan':
            return 'Subsignal - Fund Plan';
        default:
            return 'Subscription';
    }
};

export const getAcknowledgementMessageLines = (
    status: BillingEntitlementStatus,
    currentPlan: BillingPlan,
) => {
    switch (status) {
        case 'active':
            return [
                `We know activation emails are supposed to be boring, but we can't resist saying a heartfelt thanks.`,
                `Your ${formattedPlan(currentPlan)} has been activated, and we're thrilled to have you with us. Cheers!`,
            ];
        case 'inactive':
            return [
                `Your subscription renewal didn't go through — probably a payment hiccup. No stress, it happens.`,
                `Try updating your payment method and we'll get you back on track.`,
            ];
        default:
            return [''];
    }
};
