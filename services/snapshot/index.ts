import { PaginationOptions } from '@/db/queries/types';
import { snapshotRepository, SnapshotRepository } from '@/repository/snapshot';
import { diffService, DiffService } from '@/services/diff';
import { screenshotService, ScreenshotService } from '@/services/screenshot';
import { pageQueries } from '@/db/queries/page';
import { SnapshotContent, SnapshotWithContent } from '@/types/snapshot';
import { companyQueries } from '@/db/queries/company';
import { inngest } from '@/ingest/client';
import type { GetStepTools } from 'inngest';
import { DiffProperty } from '@/types/diff/content';
import { ALL_DIFF_PROPERTIES } from '@/constants/preferences';

/**
 * Service for creating snapshots of company pages
 * @description This service is used to create snapshots of company pages
 */
export class SnapshotService {
    private static instance: SnapshotService;
    private snapshotRepository: SnapshotRepository;
    private diffService: DiffService;
    private screenshotService: ScreenshotService;

    private constructor() {
        this.snapshotRepository = snapshotRepository;
        this.diffService = diffService;
        this.screenshotService = screenshotService;
    }

    /**
     * Get singleton instance of SnapshotService
     */
    public static getInstance(): SnapshotService {
        if (!SnapshotService.instance) {
            SnapshotService.instance = new SnapshotService();
        }
        return SnapshotService.instance;
    }

    /**
     * Create a live snapshot for a page
     * And prepare a diff against the last snapshot
     */
    private async createLiveSnapshotForPage(
        pageId: string,
        pageProperties: string[],
        pageURL: string,
    ) {
        // Create a live screenshot and return the HTML and screenshot along with the diff
        const { htmlContent: liveHTMLContent, imageContent: liveScreenshot } =
            await this.screenshotService.takeLiveScreenshot(pageURL);

        // Get the last snapshot if it exists
        let lastSnapshot: SnapshotWithContent | null = null;
        try {
            lastSnapshot = (await this.snapshotRepository.getLastSnapshotForPage(
                pageId,
                pageURL,
                'html',
            )) as SnapshotWithContent | null;

            if (!lastSnapshot || !lastSnapshot.html) {
                throw new Error('Last snapshot not found');
            }
        } catch (error) {
            console.error(`Failed to get last snapshot for page ${pageId}:`, error);
            return await this.snapshotRepository.createSnapshotForPage(
                pageId,
                pageURL,
                liveHTMLContent,
                liveScreenshot,
            );
        }

        // If the last snapshot exists, we need to calculate the diff with the live snapshot
        let snapshotDiff: string | null = null;
        try {
            const options = {
                properties: pageProperties.filter((prop): prop is DiffProperty =>
                    ALL_DIFF_PROPERTIES.includes(prop as DiffProperty),
                ),
            };
            snapshotDiff = await this.diffService.contentDiff(
                lastSnapshot.html,
                liveHTMLContent,
                options,
            );
        } catch (error) {
            console.error(`Failed to calculate diff for page ${pageId}:`, error);
            return await this.snapshotRepository.createSnapshotForPage(
                pageId,
                pageURL,
                liveHTMLContent,
                liveScreenshot,
            );
        }

        // Create the new snapshot with the diff
        return await this.snapshotRepository.createSnapshotForPage(
            pageId,
            pageURL,
            liveHTMLContent,
            liveScreenshot,
            snapshotDiff,
        );
    }

    /**
     * Create an live snapshot and archive snapshot
     * And prepare a diff against the archive snapshot
     */
    private async createArchiveSnapshotForPage(
        pageId: string,
        pageProperties: string[],
        pageURL: string,
    ) {
        // Fetch the archive HTML content
        try {
            const { htmlContent: archiveHTMLContent } =
                await this.screenshotService.takeArchiveScreenshot(pageURL);

            // Store the archive HTML content
            await this.snapshotRepository.createArchiveSnapshotForPage(
                pageId,
                pageURL,
                archiveHTMLContent,
            );
        } catch (error) {
            console.error(`Failed to create archive snapshot for page ${pageId}:`, error);
        }

        // Then attempt to create a live snapshot
        return this.createLiveSnapshotForPage(pageId, pageProperties, pageURL);
    }

    /**
     * Create a snapshot for a page
     */
    async createSnapshotForPage(
        pageId: string,
        userId: string,
        pageProperties: string[],
        type: 'live' | 'archive' = 'live',
    ) {
        const page = await pageQueries.getPageById(pageId, userId);
        if (!page) {
            throw new Error('Page not found');
        }

        let snapshot: SnapshotWithContent | null = null;
        if (type === 'live') {
            snapshot = await this.createLiveSnapshotForPage(pageId, pageProperties, page.url);
        } else {
            snapshot = await this.createArchiveSnapshotForPage(pageId, pageProperties, page.url);
        }

        return snapshot;
    }

    /**
     * Queue a snapshot for a page
     * @description This function will queue a snapshot for a page
     * It will break the creation into multiple durable steps to prevent all-or-nothing failures.
     * @param step - The step to send the snapshot events to
     * @param pageId - The ID of the page to create a snapshot for
     * @param userId - The ID of the user to create a snapshot for
     * @param type - The type of snapshot to create (live or archive)
     */
    async queueCreateSnapshotForPage(
        step: GetStepTools<typeof inngest>,
        pageId: string,
        userId: string,
        pageProperties: string[],
        type: 'live' | 'archive' = 'live',
    ) {
        // Add validation to catch undefined values early
        if (!pageId?.trim()) {
            throw new Error(
                `Invalid pageId provided: ${pageId}. PageId cannot be undefined, null, or empty.`,
            );
        }
        if (!userId?.trim()) {
            throw new Error(
                `Invalid userId provided: ${userId}. UserId cannot be undefined, null, or empty.`,
            );
        }
        if (!pageProperties || !Array.isArray(pageProperties)) {
            throw new Error(
                `Invalid pageProperties provided: ${pageProperties}. PageProperties must be a valid array.`,
            );
        }

        console.log(
            `[SnapshotService] Creating ${type} snapshot for pageId: ${pageId}, userId: ${userId}`,
        );

        return await this.createSnapshotForPage(pageId, userId, pageProperties, type);
    }

    /**
     * Fetch the latest snapshot for a page
     */
    async fetchLatestSnapshotForPage(
        pageId: string,
        userId: string,
        content: SnapshotContent = 'diff',
    ) {
        const page = await pageQueries.getPageById(pageId, userId);
        if (!page) {
            throw new Error('Page not found');
        }

        return await this.snapshotRepository.getLastSnapshotForPage(pageId, page.url, content);
    }

    /**
     * Fetch the latest snapshot for a company
     */
    async fetchLatestSnapshotForCompany(
        companyId: string,
        userId: string,
        content: SnapshotContent = 'diff',
    ) {
        const company = await companyQueries.getCompanyById(companyId, userId);
        if (!company) {
            throw new Error('Company not found');
        }
        return await this.snapshotRepository.getLastSnapshotsForCompany(companyId, content);
    }

    /**
     * List snapshots for a page
     */
    async listSnapshotsForPage(
        pageId: string,
        userId: string,
        options: PaginationOptions = {},
        content: SnapshotContent = 'diff',
    ) {
        const page = await pageQueries.getPageById(pageId, userId);
        if (!page) {
            throw new Error('Page not found');
        }
        return await this.snapshotRepository.listSnapshotsForPage(
            pageId,
            page.url,
            content,
            options,
        );
    }

    /**
     * Queue a snapshot for a user
     * @description This function will queue a snapshot for a list of users
     * It will first find the pages of each user and then create a snapshot event for each page
     * @param step - The step to send the snapshot events to
     * @param userIds - The list of users to queue snapshots for
     * @param type - The type of snapshot to create (live or archive)
     */
    async queueSnapshotForUsers(
        step: GetStepTools<typeof inngest>,
        userData: { userId: string; properties: Record<string, any> }[],
    ) {
        // Process all users in parallel
        const userProcessingPromises = userData.map(async (user) => {
            const allSnapshotEvents = [];
            let hasNext = true;
            let page = 1;

            // Collect all pages for this user
            while (hasNext) {
                const result = await pageQueries.getPaginatedPagesByUser(user.userId, {
                    page,
                    pageSize: 10,
                });

                // If there are no more pages, break the loop
                if (result.data.length === 0) {
                    break;
                }

                // Add snapshot events for each page
                const snapshotEvents = result.data.map((pageWithCompany) => ({
                    name: 'snapshot/create.live.snapshot',
                    data: {
                        pageId: pageWithCompany.page.id,
                        userId: user.userId,
                        pageProperties: user.properties,
                    },
                }));

                allSnapshotEvents.push(...snapshotEvents);

                // If there are more pages, continue the loop
                hasNext = result.pagination.hasNext;
                page = result.pagination.page + 1;
            }

            // Send all events for this user at once (if any)
            if (allSnapshotEvents.length > 0) {
                // Make batches of 5000 events
                const batches = [];
                for (let i = 0; i < allSnapshotEvents.length; i += 5000) {
                    batches.push(allSnapshotEvents.slice(i, i + 5000));
                }

                // Send each batch to the step
                for (const batch of batches) {
                    console.log(`[SnapshotService] Sending batch of ${batch.length} events`);
                    await step.sendEvent('snapshot/create.live.snapshot', batch);
                }
            }
        });

        // Wait for all users to be processed, allowing some to fail without stopping others
        const results = await Promise.allSettled(userProcessingPromises);

        // Log any failures for monitoring
        const failedUsers = results.filter((result) => result.status === 'rejected');
        if (failedUsers.length > 0) {
            console.warn(
                `Failed to process ${failedUsers.length} users:`,
                failedUsers.map((r) => r.reason),
            );
        }

        const successfulUsers = results.filter((result) => result.status === 'fulfilled').length;

        return { successfulUsers, totalUsers: userData.length };
    }
}

export const snapshotService = SnapshotService.getInstance();
