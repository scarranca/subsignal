import { batchCreateCompany } from './functions/batch';
import {
    // Create snapshot functions
    createArchiveSnapshot,
    createLiveSnapshot,

    // Refresh snapshot functions
    refreshSnapshot3Day,
    refreshSnapshot7Day,
    refreshSnapshot15Day,
    refreshSnapshot1Month,
    refreshSnapshot3Month,
    refreshSnapshot6Month,
} from './functions/snapshot';
import {
    createArchiveBriefingForUser,
    createBriefingForUser,
    sendBriefingToUser,
} from './functions/briefing';
import { refreshOnboardingSnapshot, sendOnboardingEmail } from './functions/onboarding';
import {
    sendPlanChangeAcknowledgementEmail,
    sendPlanChangeConfirmationEmail,
    sendPlanDeactivationConfirmationEmail,
    sendPlanExpiredEmail,
    sendPlanReactivationTriggerEmail,
    sendPlanRenewalConfirmationEmail,
} from './functions/billing';

// Export all functions
export const functions = [
    // Batch functions
    batchCreateCompany,

    // Snapshot functions
    createArchiveSnapshot,
    createLiveSnapshot,

    // Refresh snapshot functions
    refreshSnapshot3Day,
    refreshSnapshot7Day,
    refreshSnapshot15Day,
    refreshSnapshot1Month,
    refreshSnapshot3Month,
    refreshSnapshot6Month,

    // Briefing functions
    createBriefingForUser,
    sendBriefingToUser,
    createArchiveBriefingForUser,

    // Onboarding functions
    sendOnboardingEmail,
    refreshOnboardingSnapshot,

    // Billing functions
    sendPlanChangeAcknowledgementEmail,
    sendPlanChangeConfirmationEmail,
    sendPlanRenewalConfirmationEmail,
    sendPlanDeactivationConfirmationEmail,
    sendPlanReactivationTriggerEmail,
    sendPlanExpiredEmail,
];
