import { inngest } from '../client';
import { preferenceQueries } from '@/db/queries/preference';
import { durableBriefingService } from '@/services/briefing/durable';
import { durableSnapshotService } from '@/services/snapshot/durable';
import { GetStepTools } from 'inngest';
import { Frequency } from '@/db/schema/preference';

/**
 * Create an archive snapshot for a page
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The snapshot ID
 */
export const createArchiveSnapshot = inngest.createFunction(
    { id: 'create-archive-snapshot' }, // A unique identifier for the function. This should not change between deploys.
    { event: 'snapshot/archive.created' }, // A name for the function. If defined, this will be shown in the UI as a friendly display name instead of the ID. namespace/object.action
    async ({ event, step }) => {
        const { pageId, userId, pageProperties, pageURL } = event.data;
        const snapshot = await durableSnapshotService.createArchiveSnapshotForPage(
            step,
            pageId,
            pageProperties,
            pageURL,
        );
        return {
            message: `Created archive snapshot for page ${pageId}`,
            data: {
                snapshot,
                pageProperties,
                userId,
                pageId,
            },
        };
    },
);

/**
 * Create a live snapshot for a page
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The snapshot ID
 */
export const createLiveSnapshot = inngest.createFunction(
    {
        id: 'create-live-snapshot', // A unique identifier for the function. This should not change between deploys.
        throttle: {
            limit: 30, // 30 requests per minute across ALL requests
            period: '1m', // Per minute
            burst: 5, // Allow slightly larger bursts since it's global
            // No key = global throttling across entire service
        },
    },
    { event: 'snapshot/live.created' }, // A name for the function. If defined, this will be shown in the UI as a friendly display name instead of the ID. namespace/object.action
    async ({ event, step }) => {
        const { pageId, userId, pageProperties, pageURL } = event.data;
        const snapshot = await durableSnapshotService.createLiveSnapshotForPage(
            step,
            pageId,
            pageProperties,
            pageURL,
        );
        return {
            message: `Created live snapshot for page ${pageId}`,
            data: {
                snapshot,
                pageProperties,
                userId,
                pageId,
            },
        };
    },
);

export const refreshSnapshot3Day = inngest.createFunction(
    {
        id: 'refresh-snapshot-3-day',
        throttle: {
            limit: 30,
            period: '1m',
            burst: 5,
        },
    },
    { cron: '0 0 1,16 * *' },
    async ({ event, step }) => {
        return await refreshSnapshotsForFrequency(step, '3_day');
    },
);

/**
 * Refresh snapshots for all users with 7 day frequency
 */
export const refreshSnapshot7Day = inngest.createFunction(
    {
        id: 'refresh-snapshot-7-day',
        throttle: {
            limit: 30,
            period: '1m',
            burst: 5,
        },
    },
    { cron: '0 0 * * 0' },

    async ({ event, step }) => {
        return await refreshSnapshotsForFrequency(step, '7_day');
    },
);

/**
 * Refresh snapshots for all users with 15 day frequency
 */
export const refreshSnapshot15Day = inngest.createFunction(
    {
        id: 'refresh-snapshot-15-day',
        throttle: {
            limit: 30,
            period: '1m',
            burst: 5,
        },
    },
    { cron: '0 0 1,16 * *' },
    async ({ event, step }) => {
        return await refreshSnapshotsForFrequency(step, '15_day');
    },
);

/**
 * Refresh snapshots for all users with 1 month frequency
 */
export const refreshSnapshot1Month = inngest.createFunction(
    {
        id: 'refresh-snapshot-1-month',
        throttle: {
            limit: 30,
            period: '1m',
            burst: 5,
        },
    },
    { cron: '0 0 1 * *' },
    async ({ event, step }) => {
        return await refreshSnapshotsForFrequency(step, '1_month');
    },
);

/**
 * Refresh snapshots for all users with 3 month frequency
 */
export const refreshSnapshot3Month = inngest.createFunction(
    {
        id: 'refresh-snapshot-3-month',
        throttle: {
            limit: 30,
            period: '1m',
            burst: 5,
        },
    },
    { cron: '0 0 1 */3 *' },
    async ({ event, step }) => {
        return await refreshSnapshotsForFrequency(step, '3_month');
    },
);

/**
 * Refresh snapshots for all users with 6 month frequency
 */
export const refreshSnapshot6Month = inngest.createFunction(
    {
        id: 'refresh-snapshot-6-month',
        throttle: {
            limit: 30,
            period: '1m',
            burst: 5,
        },
    },
    { cron: '0 0 1 */6 *' },
    async ({ event, step }) => {
        return await refreshSnapshotsForFrequency(step, '6_month');
    },
);

/**
 * Refresh snapshots for all users with a given frequency
 * @param step - The step to send the snapshot events to
 * @param frequency - The frequency to refresh snapshots for
 * @param options - The options for the refresh
 * @returns The result of the refresh
 */
async function refreshSnapshotsForFrequency(
    step: GetStepTools<typeof inngest>,
    frequency: Frequency,
    options: {
        includeBriefing?: boolean;
        briefingDelay?: string;
    } = {},
) {
    const { includeBriefing = true, briefingDelay = getBriefingDelay() } = options;

    // Step 1: Get users for this frequency
    const users = await preferenceQueries.getUsersByFrequency(frequency);
    if (users.length === 0) {
        console.log(`No users found for ${frequency} refresh`);
        return { message: 'No users to process' };
    }

    const userData = users.map((user) => ({
        userId: user.userId,
        properties: user.properties,
        frequency: frequency,
    }));

    // Step 2: Queue snapshots for all users
    const result = await durableSnapshotService.refreshSnapshotForUsers(step, userData);

    // Step 3: Optional briefing flow
    if (includeBriefing) {
        // Wait for snapshots to complete
        await step.sleep('wait-for-snapshot-completion', briefingDelay);

        // Send briefing events for all users
        await durableBriefingService.createBriefingForUsers(step, userData);
    }

    return {
        message: `${frequency} refresh completed`,
        stats: {
            totalUsers: users.length,
            successfulSnapshots: result.successfulUsers,
            briefingsSent: includeBriefing ? userData.length : 0,
        },
    };
}

/**
 * Get the briefing delay based on the environment
 * @returns The briefing delay
 */
function getBriefingDelay(): string {
    return process.env.NODE_ENV === 'production' ? '24h' : '10s';
}
