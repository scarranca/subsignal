// Email subjects for each subscription status
export const SUBSCRIPTION_SUBJECTS = {
    active: 'Subsignal - Access Confirmed! You are in!',
    failed: "Subsignal - Oops! Let's get your subscription sorted",
    renewed: 'Subsignal - Successfully renewed! Thanks for staying with us',
    on_hold: "Subsignal - Your Spot's Still Warm",
    cancelled: "Subsignal - Let's Figure This Out Together",
    expired: "Subsignal - We're keeping your spot warm till you're ready",
    default: 'Subsignal - Subscription Update',
} as const;
// Onboarding subject variations
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

// Briefing subjects (original variations)
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

// Helper function to get subscription subject by status
export const getSubscriptionSubject = (status: keyof typeof SUBSCRIPTION_SUBJECTS): string => {
    return SUBSCRIPTION_SUBJECTS[status] || SUBSCRIPTION_SUBJECTS.default;
};

// Helper function to get random briefing subject with company name
export const getBriefingSubject = (companyName: string): string => {
    const randomSubject = BRIEFING_SUBJECTS[Math.floor(Math.random() * BRIEFING_SUBJECTS.length)];
    const dateString = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    return `${randomSubject} for ${companyName} - ${dateString}`;
};

// Helper function to get random onboarding subject
export const getOnboardingSubject = (): string => {
    return ONBOARDING_SUBJECTS[Math.floor(Math.random() * ONBOARDING_SUBJECTS.length)];
};

export const getAcknowledgementPreviewText = (
    status: 'active' | 'failed' | 'renewed' | 'on_hold' | 'cancelled' | 'expired',
) => {
    switch (status) {
        case 'active':
            return 'You made our nights and weekends worth it';
        case 'failed':
            return "Oops! Let's get your subscription sorted";
        case 'renewed':
            return 'Another month together — we love having you around';
        case 'on_hold':
            return "Your Spot's Still Warm. Let's Figure This Out Together.";
        case 'cancelled':
            return "Your Spot's Still Warm. Let's Figure This Out Together.";
        case 'expired':
            return "We're keeping your spot warm till you're ready";
        default:
            return 'Subscription Update';
    }
};

export const getAcknowledgementTitle = (
    status: 'active' | 'failed' | 'renewed' | 'on_hold' | 'cancelled' | 'expired',
) => {
    switch (status) {
        case 'active':
            return 'Access Confirmed';
        case 'failed':
            return 'Activation Issue';
        case 'renewed':
            return 'Successfully Renewed';
        case 'on_hold':
            return "Your Spot's Still Warm";
        case 'cancelled':
            return "Your Spot's Still Warm";
        case 'expired':
            return "We're Here When You're Ready";
        default:
            return 'Subscription Update';
    }
};

export const getAcknowledgementSubtitle = (
    status: 'active' | 'failed' | 'renewed' | 'on_hold' | 'cancelled' | 'expired',
) => {
    switch (status) {
        case 'active':
            return 'No, this is not a boring activation email';
        case 'failed':
            return "Let's get this sorted quickly";
        case 'renewed':
            return 'Thanks for sticking with us';
        case 'on_hold':
            return "Alright, let's get you back in";
        case 'cancelled':
            return "Let's Figure This Out Together";
        case 'expired':
            return "We're keeping your spot warm till you're ready";
        default:
            return '';
    }
};

const formatDate = (date?: Date | null) =>
    date ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date) : '—';

export const getSubscriptionStartDate = (subscriptionStartedAt: Date | null | undefined) => {
    return formatDate(subscriptionStartedAt);
};

export const getCurrentPeriodEnd = (currentPeriodEnd: Date | null | undefined) => {
    return formatDate(currentPeriodEnd);
};

export const formattedPlan = (
    plan: 'solo_plan' | 'team_plan' | 'enterprise_plan' | undefined | null,
) => {
    switch (plan) {
        case 'solo_plan':
            return 'Subsignal - Solo Plan';
        case 'team_plan':
            return 'Subsignal - Team Plan';
        case 'enterprise_plan':
            return 'Subsignal - Funds Plan';
        default:
            return 'Subscription';
    }
};

export const getAcknowledgementMessageLines = (
    status: 'active' | 'failed' | 'renewed' | 'on_hold' | 'cancelled' | 'expired',
    currentPlan: 'solo_plan' | 'team_plan' | 'enterprise_plan' | undefined | null,
) => {
    switch (status) {
        case 'active':
            return [
                `We know activation emails are supposed to be boring, but we can't resist saying a heartfelt thanks.`,
                `Your ${formattedPlan(currentPlan)} has been activated, and we're grateful to have you with us.`,
            ];
        case 'failed':
            return [
                `We ran into an issue activating your subscription. Don't worry — these things happen, and we're here to help.`,
                `Please check your payment method or contact our support team, and we'll get you set up right away.`,
            ];
        case 'renewed':
            return [
                `Your ${formattedPlan(currentPlan)} has been successfully renewed. Thanks for continuing this journey with us!`,
                `We're just an email away if you need anything.`,
            ];
        case 'on_hold':
            return [
                `Your subscription renewal didn't go through — probably a payment hiccup. No stress, it happens.`,
                `Try updating your payment method and we'll get you back on track.`,
            ];
        case 'cancelled':
            return [
                `Not going to lie — it's sad to see you go. Your subscription is cancelled.`,
                `Mind if we ask what held you back from staying? Hit reply with any feedback, and we'll try doing right by you — no strings attached.`,
            ];
        case 'expired':
            return [
                `Not going to lie — it's sad to see you go. Your subscription expired. We hope you had a good time!`,
                `If you'd like to return, reactivating is quick, and we'd love to have you back. We're keeping your spot warm till you're ready.`,
            ];
        default:
            return [''];
    }
};
