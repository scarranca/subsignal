import { snapshotService } from '@/services/snapshot';
import { inngest } from '../client';
import { preferenceQueries } from '@/db/queries/preference';

export const createArchiveSnapshot = inngest.createFunction(
    { id: 'create-archive-snapshot' },
    { event: 'snapshot/create.archive.snapshot' },
    async ({ event, step }) => {
        const { pageId, userId, pageProperties } = event.data;
        console.log('API Handler - Create archive snapshot for page:', pageId);
        const snapshot = await snapshotService.queueCreateSnapshotForPage(
            step,
            pageId,
            userId,
            pageProperties,
            'archive',
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

export const createLiveSnapshot = inngest.createFunction(
    { id: 'create-live-snapshot' },
    { event: 'snapshot/create.live.snapshot' },
    async ({ event, step }) => {
        const { pageId, userId, pageProperties } = event.data;
        console.log('API Handler - Create live snapshot for page:', pageId);

        if (!pageId) {
            throw new Error('Page ID is required');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!pageProperties) {
            throw new Error('Page properties are required');
        }

        const snapshot = await snapshotService.queueCreateSnapshotForPage(
            step,
            pageId,
            userId,
            pageProperties,
            'live',
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

export const refreshSnapshot7Day = inngest.createFunction(
    { id: 'refresh-snapshot-7-day' },
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

        const result = await snapshotService.queueSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

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

        const result = await snapshotService.queueSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

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

        const result = await snapshotService.queueSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

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

        const result = await snapshotService.queueSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);

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

        const result = await snapshotService.queueSnapshotForUsers(step, userData);
        console.log(
            `Successfully processed ${result.successfulUsers} out of ${users.length} users`,
        );
    },
);
