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
import { createBriefingForUser, sendBriefingToUser } from './functions/briefing';

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
];
