import { batchCreateCompany, sendOnboardingEmail } from './functions/onboarding';
import {
    // Create snapshot functions
    createArchiveSnapshot,
    createLiveSnapshot,

    // Refresh snapshot functions
    refreshSnapshot7Day,
    refreshSnapshot15Day,
    refreshSnapshot1Month,
    refreshSnapshot3Month,
    refreshSnapshot6Month,
} from './functions/snapshot';
import { createBriefingForUser, sendBriefingToUser } from './functions/briefing';

// Export all functions
export const functions = [
    // Onboarding functions
    batchCreateCompany,
    sendOnboardingEmail,

    // Snapshot functions
    createArchiveSnapshot,
    createLiveSnapshot,
    refreshSnapshot7Day,
    refreshSnapshot15Day,
    refreshSnapshot1Month,
    refreshSnapshot3Month,
    refreshSnapshot6Month,

    // Briefing functions
    createBriefingForUser,
    sendBriefingToUser,
];
