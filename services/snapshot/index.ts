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
     * Refresh snapshots for a list of users
     * @description This function will refresh snapshots for a list of users
     * It will first find the pages of each user and then create a snapshot event for each page
     * @param step - The step to send the snapshot events to
     * @param userData - The list of users to refresh snapshots for
     */
    async refreshSnapshotForUsers(
        step: GetStepTools<typeof inngest>,
        userData: { userId: string; properties: Record<string, any> }[],
    ) {
        let successfulUsers = 0;
        let totalEvents = 0;

        // Process each user as a separate step for better isolation and retry logic
        for (let userIndex = 0; userIndex < userData.length; userIndex++) {
            const user = userData[userIndex];

            // Step 1: Get all pages for this user
            const userPages = await step.run(`get-pages-${user.userId}`, async () => {
                const allPages = [];
                let hasNext = true;
                let page = 1;

                while (hasNext) {
                    const result = await pageQueries.getPaginatedPagesByUser(user.userId, {
                        page,
                        pageSize: 10,
                    });

                    if (result.data.length === 0) {
                        break;
                    }

                    allPages.push(...result.data);
                    hasNext = result.pagination.hasNext;
                    page = result.pagination.page + 1;
                }

                return allPages;
            });

            // Skip if user has no pages
            if (userPages.length === 0) {
                continue;
            }

            // Step 2: Create snapshot events for this user's pages
            const snapshotEvents = userPages.map((pageWithCompany) => ({
                name: 'snapshot/create.live.snapshot',
                data: {
                    pageId: pageWithCompany.page.id,
                    userId: user.userId,
                    pageProperties: user.properties,
                },
            }));

            // Step 3: Send events in batches
            const BATCH_SIZE = 1000;
            const batches = [];
            for (let i = 0; i < snapshotEvents.length; i += BATCH_SIZE) {
                batches.push(snapshotEvents.slice(i, i + BATCH_SIZE));
            }

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];

                await step.run(`send-events-${user.userId}-batch-${batchIndex}`, async () => {
                    console.log(
                        `[SnapshotService] Sending batch ${batchIndex + 1}/${batches.length} of ${batch.length} events for user ${user.userId}`,
                    );
                    await step.sendEvent('snapshot/create.live.snapshot', batch);
                    return { batchIndex, eventCount: batch.length };
                });
            }

            successfulUsers++;
            totalEvents += snapshotEvents.length;
        }

        return { successfulUsers, totalUsers: userData.length, totalEvents };
    }
}

export const snapshotService = SnapshotService.getInstance();
