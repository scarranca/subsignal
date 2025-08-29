import { BillingEntitlementStatus, BillingPlan } from '@/db/schema/billing';

/**
 * Email scenarios based on your Inngest function parameters
 */
export type EmailScenario =
    | 'plan_change_ack' // { newPlan, subscriptionId }
    | 'plan_change_confirmed' // { newPlan, subscriptionId }
    | 'plan_renewal_confirmed' // { currentPlan, subscriptionId }
    | 'plan_deactivation' // { deactivatedPlan, subscriptionId }
    | 'plan_reactivation' // { onHoldPlan, subscriptionId }
    | 'plan_expired' // { expiredPlan, subscriptionId }
    | 'subscription_active' // existing active status
    | 'subscription_inactive'; // existing inactive status

/**
 * Email subjects for each scenario
 */
export const EMAIL_SUBJECTS: Record<EmailScenario, string> = {
    plan_change_ack: 'Subsignal - Plan Change in Progress',
    plan_change_confirmed: 'Subsignal - Plan Updated Successfully!',
    plan_renewal_confirmed: 'Subsignal - Your Plan Has Been Renewed',
    plan_deactivation: 'Subsignal - Plan Deactivated',
    plan_reactivation: 'Subsignal - Action Required',
    plan_expired: 'Subsignal - Your Plan Has Expired',
    subscription_active: 'Subsignal - Access Confirmed! You are in!',
    subscription_inactive: "Subsignal - We're keeping your spot warm till you're ready",
};

/**
 * Get email subject by scenario
 */
export const getEmailSubject = (scenario: EmailScenario): string => {
    return EMAIL_SUBJECTS[scenario];
};

/**
 * Get preview text for emails
 */
export const getPreviewText = (scenario: EmailScenario): string => {
    switch (scenario) {
        case 'subscription_active':
            return 'You made our nights and weekends worth it';
        case 'subscription_inactive':
            return "Your Spot's Still Warm. Let's Figure This Out Together";
        case 'plan_change_ack':
            return 'Your plan change request is being processed';
        case 'plan_change_confirmed':
            return 'Your requested plan is now active';
        case 'plan_renewal_confirmed':
            return 'Your subscription has been renewed';
        case 'plan_deactivation':
            return "We'll keep your spot warm";
        case 'plan_reactivation':
            return "Let's get you back on track";
        case 'plan_expired':
            return 'Time for a refresh';
        default:
            return 'A quick update on your subscription';
    }
};

/**
 * Get title for emails
 */
export const getTitle = (scenario: EmailScenario): string => {
    switch (scenario) {
        case 'subscription_active':
            return 'You are in!';
        case 'subscription_inactive':
            return "We're Here When You're Ready";
        case 'plan_change_ack':
            return 'Plan update in progress';
        case 'plan_change_confirmed':
            return 'Plan Updated Successfully!';
        case 'plan_renewal_confirmed':
            return 'Your Plan Has Been Renewed';
        case 'plan_deactivation':
            return 'Plan Deactivated';
        case 'plan_reactivation':
            return "Uh oh! Let's get you back on track";
        case 'plan_expired':
            return 'Your Plan Has Expired';
        default:
            return 'Subscription Update';
    }
};

/**
 * Get subtitle for emails
 */
export const getSubtitle = (scenario: EmailScenario): string => {
    switch (scenario) {
        case 'subscription_active':
            return 'No, this is not a boring activation email';
        case 'subscription_inactive':
            return "Alright, let's get you back in";
        case 'plan_change_ack':
            return "We're processing your plan change";
        case 'plan_change_confirmed':
            return 'Your plan is now active and ready to use';
        case 'plan_renewal_confirmed':
            return "Let's keep the good times rolling";
        case 'plan_deactivation':
            return 'Your plan is now inactive';
        case 'plan_reactivation':
            return "Don't worry, we've got your back! Let's get you reactivated";
        case 'plan_expired':
            return "Let's keep the good times rolling";
        default:
            return 'An update on your subscription';
    }
};

/**
 * Get a formatted plan name
 */
export const getFormattedPlan = (plan?: BillingPlan | null): string => {
    if (!plan) return 'No Plan';

    switch (plan) {
        case 'solo_plan':
            return 'Subsignal Solo Plan';
        case 'team_plan':
            return 'Subsignal Team Plan';
        case 'custom_plan':
            return 'Subsignal Custom Plan';
        default:
            return 'Subsignal Plan';
    }
};

/**
 * Get message lines based on scenario and available parameters
 */
export const getMessageLines = (
    scenario: EmailScenario,
    params: {
        newPlan?: BillingPlan;
        currentPlan?: BillingPlan;
        deactivatedPlan?: BillingPlan;
        onHoldPlan?: BillingPlan;
        expiredPlan?: BillingPlan;
    },
): string[] => {
    switch (scenario) {
        case 'subscription_active':
            return [
                `We know activation emails are supposed to be boring, but we can't resist saying a heartfelt thanks.`,
                `Your ${getFormattedPlan(params.currentPlan)} has been activated, and we're thrilled to have you with us. Cheers!`,
            ];
        case 'subscription_inactive':
            return [
                `Your subscription renewal didn't go through - no worries, happens to the best of us.`,
                `When you're ready, just update your payment method and we'll get you back on track. We are keeping your spot warm until then. Cheers!`,
            ];
        case 'plan_change_ack':
            return [
                `We're updating you to ${getFormattedPlan(params.newPlan)}.`,
                `This typically completes right away, though occasionally it may take up to 72 hours. We'll confirm once everything's ready.`,
            ];
        case 'plan_change_confirmed':
            return [
                `Great news! Your plan change is complete.`,
                `You're now on the ${getFormattedPlan(params.newPlan)} and can enjoy all the new features and benefits right away.`,
            ];
        case 'plan_renewal_confirmed':
            return [
                `Your ${getFormattedPlan(params.currentPlan)} has been successfully renewed.`,
                `Thanks for sticking with us! Cheers!`,
            ];
        case 'plan_deactivation':
            return [
                `Your ${getFormattedPlan(params.deactivatedPlan)} has been deactivated as requested.`,
                `If you decide to reactivate in the future, just update your payment method and we'll get you back on track. Cheers!`,
            ];
        case 'plan_reactivation':
            return [
                `Hey there! Your ${getFormattedPlan(params.onHoldPlan)} got put on hold - no biggie!`,
                `Just update your payment method and we'll get you back to business in no time. Need help? We're here for you!`,
            ];
        case 'plan_expired':
            return [
                `Your ${getFormattedPlan(params.expiredPlan)} has expired.`,
                `Just refresh your payment method and you'll be back in no time. Cheers!`,
            ];
        default:
            return ['Your subscription has been updated.'];
    }
};

/**
 * Get action button text for different scenarios
 */
export const getActionButtonText = (scenario: EmailScenario): string | null => {
    switch (scenario) {
        case 'subscription_inactive':
            return 'Reactivate Access';
        case 'plan_expired':
            return 'Renew Access';
        case 'plan_deactivation':
            return 'Reactivate Access';
        case 'subscription_active':
        case 'plan_change_confirmed':
        case 'plan_renewal_confirmed':
            return 'Go to Dashboard';
        case 'plan_reactivation':
            return 'Reactivate Access';
        default:
            return null;
    }
};

/**
 * Get action button URL for different scenarios
 */
export const getActionButtonUrl = (scenario: EmailScenario): string | null => {
    switch (scenario) {
        case 'subscription_inactive':
            return 'https://subsignal.app/dashboard';
        case 'plan_expired':
            return 'https://subsignal.app/dashboard';
        case 'plan_deactivation':
            return 'https://subsignal.app/dashboard';
        case 'subscription_active':
        case 'plan_change_confirmed':
        case 'plan_renewal_confirmed':
        case 'plan_reactivation':
            return 'https://subsignal.app/dashboard';
        default:
            return null;
    }
};

/**
 * Get a random briefing subject
 */
export const getBriefingSubject = (companyName: string): string => {
    const BRIEFING_SUBJECTS = [
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

    const randomSubject = BRIEFING_SUBJECTS[Math.floor(Math.random() * BRIEFING_SUBJECTS.length)];
    const dateString = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    return `${randomSubject} for ${companyName} - ${dateString}`;
};

/**
 * Get a random onboarding subject
 */
export const getOnboardingSubject = (): string => {
    const ONBOARDING_SUBJECTS = [
        "Welcome Aboard! Let's Get You Started",
        "Let's Make Your First Move",
        "Discover What's Next",
        'Time to Dive In',
        "Let's Get You Started",
        "Let's Get Started",
        "Alright baby steps! Let's Get You Started",
    ] as const;

    return ONBOARDING_SUBJECTS[Math.floor(Math.random() * ONBOARDING_SUBJECTS.length)];
};
