import { briefingService } from '@/services/briefing';
import { inngest } from '../client';
import { emailService } from '@/services/email';
import { userQueries, companyQueries } from '@/db/queries';
import { NonRetriableError } from 'inngest';

/**
 * Create a briefing for a user
 * @param event.data.userId - The ID of the user to create a briefing for
 * @param event.data.properties - The properties to use when creating the briefing
 */
export const createBriefingForUser = inngest.createFunction(
    { id: 'create-briefing' },
    { event: 'briefing/create.briefing' },
    async ({ event, step }) => {
        const { userId, properties } = event.data;
        if (!userId) {
            throw new NonRetriableError('User ID is required');
        }

        // Step 1: Get all company IDs for the user using pagination
        let page = 1;
        let hasMore = true;
        const companyIds = [];

        while (hasMore) {
            const result = await companyQueries.getActiveCompaniesByUser(userId, {
                page,
                pageSize: 50, // Fetch 50 companies per page
            });

            if (result.data.length === 0) {
                break;
            }

            // Extract company IDs
            companyIds.push(...result.data.map((company) => company.id));

            hasMore = result.pagination.hasNext;
            page = result.pagination.page + 1;
        }

        if (companyIds.length === 0) {
            console.error(`No companies found for user ${userId}`);
            return { message: 'No companies to create briefings for' };
        }

        // Step 2: Create briefings for each company
        for (let i = 0; i < companyIds.length; i++) {
            const companyId = companyIds[i];

            await step.run(`create-briefing-for-company-${companyId}`, async () => {
                await briefingService.createBriefingForCompany(companyId, properties);
            });
        }

        // Step 3: Send briefing events in batches
        const briefingEvents = companyIds.map((companyId) => ({
            name: 'briefing/send.briefing',
            data: {
                userId,
                companyId,
            },
        }));

        // Send in batches of 10
        const BATCH_SIZE = 10;
        const batches = [];
        for (let i = 0; i < briefingEvents.length; i += BATCH_SIZE) {
            batches.push(briefingEvents.slice(i, i + BATCH_SIZE));
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            await step.sendEvent('briefing/send.briefing', batch);
        }

        return {
            message: `Briefing creation completed for user ${userId}`,
            stats: {
                companiesProcessed: companyIds.length,
                briefingEventsQueued: briefingEvents.length,
            },
        };
    },
);

/**
 * Send a briefing to a user
 * @param event.data.userId - The ID of the user to send the briefing to
 * @param event.data.companyId - The ID of the company to send the briefing for
 */
export const sendBriefingToUser = inngest.createFunction(
    {
        id: 'send-briefing',
        throttle: {
            limit: 2,
            period: '5s',
        },
    },
    { event: 'briefing/send.briefing' },
    async ({ event, step }) => {
        const { userId, companyId } = event.data;

        // Step 0: Validate user ID and company ID
        if (!userId) {
            throw new NonRetriableError('User ID not found');
        }

        if (!companyId) {
            throw new NonRetriableError('Company ID not found');
        }

        // Step 1: Get user email
        const userEmailData = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailData) {
            throw new NonRetriableError(`User email not found for user ${userId}`);
        }

        // Step 2: Get briefing data
        const briefing = await briefingService.getLatestBriefingForCompany(companyId);
        if (!briefing) {
            throw new NonRetriableError(`No briefing found for company ${companyId}`);
        }

        // Step 3: Send the email
        await step.run(`send-briefing-email-${userId}-${companyId}`, async () => {
            await emailService.sendBriefingEmail(userEmailData.email, briefing);
        });

        return {
            message: `Briefing email sent successfully`,
            userId,
            companyId,
            email: userEmailData.email,
        };
    },
);
