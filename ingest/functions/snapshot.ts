import { inngest } from '../client';
import { preferenceQueries } from '@/db/queries/preference';
import { durableSnapshotService } from '@/services/snapshot/durable';

/**
 * Create an archive snapshot for a page
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The snapshot ID
 */
export const createArchiveSnapshot = inngest.createFunction(
    { id: 'create-archive-snapshot' },
    { event: 'snapshot/create.archive.snapshot' },
    async ({ event, step }) => {
        const { pageId, userId, pageProperties } = event.data;
        console.log('API Handler - Create archive snapshot for page:', pageId);
        const snapshot = await durableSnapshotService.createArchiveSnapshotForPage(
            step,
            pageId,
            userId,
            pageProperties,
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
        id: 'create-live-snapshot',
        throttle: {
            limit: 30, // 30 requests per minute across ALL requests
            period: '1m', // Per minute
            burst: 5, // Allow slightly larger bursts since it's global
            // No key = global throttling across entire service
        },
    },
    { event: 'snapshot/create.live.snapshot' },
    async ({ event, step }) => {
        const { pageId, userId, pageProperties } = event.data;
        console.log('API Handler - Create live snapshot for page:', pageId);
        const snapshot = await durableSnapshotService.createLiveSnapshotForPage(
            step,
            pageId,
            userId,
            pageProperties,
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

/**
 * Refresh snapshots for all users with 7 day frequency
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The result of the refresh
 */
export const refreshSnapshot7Day = inngest.createFunction(
    {
        id: 'refresh-snapshot-7-day',
        throttle: {
            limit: 30, // 30 requests per minute across ALL requests
            period: '1m', // Per minute
            burst: 5, // Allow slightly larger bursts since it's global
            // No key = global throttling across entire service
        },
    },
    { cron: '0 0 * * 0' },
    async ({ event, step }) => {
        // Get all users with 7 day frequency
        const users = await preferenceQueries.getUsersByFrequency('7_day');

        const userData = users.map((user) => {
            return {
                userId: user.userId,
                properties: user.properties,
            };
        });

        const result = await durableSnapshotService.refreshSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

/**
 * Refresh snapshots for all users with 15 day frequency
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The result of the refresh
 */
export const refreshSnapshot15Day = inngest.createFunction(
    { id: 'refresh-snapshot-15-day' },
    { cron: '0 0 1,16 * *' },
    async ({ event, step }) => {
        const users = await preferenceQueries.getUsersByFrequency('15_day');

        const userData = users.map((user) => {
            return {
                userId: user.userId,
                properties: user.properties,
            };
        });

        const result = await durableSnapshotService.refreshSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

/**
 * Refresh snapshots for all users with 1 month frequency
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The result of the refresh
 */
export const refreshSnapshot1Month = inngest.createFunction(
    { id: 'refresh-snapshot-1-month' },
    { cron: '0 0 1 * *' },
    async ({ event, step }) => {
        const users = await preferenceQueries.getUsersByFrequency('1_month');

        const userData = users.map((user) => {
            return {
                userId: user.userId,
                properties: user.properties,
            };
        });

        const result = await durableSnapshotService.refreshSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

/**
 * Refresh snapshots for all users with 3 month frequency
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The result of the refresh
 */
export const refreshSnapshot3Month = inngest.createFunction(
    { id: 'refresh-snapshot-3-month' },
    { cron: '0 0 1 */3 *' },
    async ({ event, step }) => {
        const users = await preferenceQueries.getUsersByFrequency('3_month');

        const userData = users.map((user) => {
            return {
                userId: user.userId,
                properties: user.properties,
            };
        });

        const result = await durableSnapshotService.refreshSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

/**
 * Refresh snapshots for all users with 6 month frequency
 * @param event - The event data
 * @param step - The step to send the snapshot events to
 * @returns The result of the refresh
 */
export const refreshSnapshot6Month = inngest.createFunction(
    { id: 'refresh-snapshot-6-month' },
    { cron: '0 0 1 */6 *' },
    async ({ event, step }) => {
        const users = await preferenceQueries.getUsersByFrequency('6_month');

        const userData = users.map((user) => {
            return {
                userId: user.userId,
                properties: user.properties,
            };
        });

        const result = await durableSnapshotService.refreshSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);
