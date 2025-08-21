import { batchCreateCompany } from './functions/onboarding';
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

// Export all functions
export const functions = [
    batchCreateCompany,
    createArchiveSnapshot,
    createLiveSnapshot,
    refreshSnapshot7Day,
    refreshSnapshot15Day,
    refreshSnapshot1Month,
    refreshSnapshot3Month,
    refreshSnapshot6Month,
];
