import { pageQueries, preferenceQueries, userQueries } from '@/db/queries';
import { inngest } from '../client';
import { NonRetriableError } from 'inngest';
import { emailService } from '@/services/email';
import { DEFAULT_PREFERENCES } from '@/constants/preferences';

/**
 * Send the onboarding email to the user
 */
export const sendOnboardingEmail = inngest.createFunction(
    {
        id: 'send-onboarding-email',
        throttle: {
            limit: 1,
            period: '1s',
        },
    },
    { event: 'onboarding/email.sent' },
    async ({ event, step }) => {
        const { userId } = event.data;

        const userEmailRecord = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailRecord) {
            throw new NonRetriableError('User email not found');
        }

        await emailService.sendOnboardingEmail(userEmailRecord.email);
    },
);

/**
 * Refresh the snapshot for the user's active pages
 * This is a one-time function to refresh the snapshot for the user's active pages
 */
export const refreshOnboardingSnapshot = inngest.createFunction(
    {
        id: 'refresh-onboarding-snapshot',
    },
    { event: 'onboarding/snapshot.refreshed' },
    async ({ event, step }) => {
        const { userId } = event.data;

        // Fetch the current user's preference
        const userPreference = await preferenceQueries.getUserPreference(userId);
        const properties = userPreference?.properties || DEFAULT_PREFERENCES;

        // Cycle through all the pages for the user
        let hasMore = true;
        let page = 1;
        let snapshotEvents: any[] = [];

        // Cycle through all the pages for the user
        while (hasMore) {
            const pageResults = await pageQueries.getActivePagesByUser(userId, {
                pageSize: 25, // Fetch upto 25 pages at a time
                page,
            });

            // Add the snapshot events to the array
            snapshotEvents = snapshotEvents.concat(
                pageResults.data.map((pageResult) => {
                    const {
                        page: { id: pageId, url: pageURL, options: pageOptions },
                    } = pageResult;

                    return {
                        name: 'snapshot/archive.created',
                        data: {
                            pageId,
                            userId,
                            pageProperties: properties,
                            pageURL,
                            pageOptions,
                        },
                        // Add a unique id to the event to avoid duplicates processing
                        id: `refresh-onboarding-snapshot-${pageId}`,
                    };
                }),
            );

            hasMore = pageResults.pagination.hasNext;
            page++;
        }

        // Send the snapshot events to the snapshot service
        await step.sendEvent('snapshot/archive.created', snapshotEvents);
    },
);
