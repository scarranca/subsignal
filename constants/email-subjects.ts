// Subscription status-based subjects
export const SUBSCRIPTION_SUBJECTS = {
    active: 'Subsignal - Access Confirmed! You are in!',
    grace: "Subsignal - Your Spot's Still Warm",
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
