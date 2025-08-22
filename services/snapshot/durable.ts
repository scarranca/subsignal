import { snapshotRepository, SnapshotRepository } from '@/repository/snapshot';
import { diffService, DiffService } from '@/services/diff';
import { screenshotService, ScreenshotService } from '@/services/screenshot';
import { pageQueries } from '@/db/queries/page';
import { SnapshotWithContent } from '@/types/snapshot';
import { inngest } from '@/ingest/client';
import { RetryAfterError, type GetStepTools } from 'inngest';
import { DiffProperty } from '@/types/diff/content';
import { ALL_DIFF_PROPERTIES } from '@/constants/preferences';

/**
 * Durable service for creating snapshots of company pages using Inngest steps
 * @description This service wraps all operations in steps for proper error handling and retries
 */
export class DurableSnapshotService {
    private static instance: DurableSnapshotService;
    private snapshotRepository: SnapshotRepository;
    private diffService: DiffService;
    private screenshotService: ScreenshotService;

    private constructor() {
        this.snapshotRepository = snapshotRepository;
        this.diffService = diffService;
        this.screenshotService = screenshotService;
    }

    /**
     * Get singleton instance of DurableSnapshotService
     */
    public static getInstance(): DurableSnapshotService {
        if (!DurableSnapshotService.instance) {
            DurableSnapshotService.instance = new DurableSnapshotService();
        }
        return DurableSnapshotService.instance;
    }

    /**
     * Create a live snapshot for a page (durable)
     * And prepare a diff against the last snapshot
     */
    async createLiveSnapshotForPage(
        step: GetStepTools<typeof inngest>,
        pageId: string,
        pageProperties: string[],
        pageURL: string,
    ) {
        // Step 1: Take live screenshot
        // Live screenshot is cached for 12 hours on first request
        // It's alright to not be strictly  durable here
        const liveContent = await this.screenshotService.takeLiveScreenshot(pageURL);

        // Step 2: Get the last snapshot
        // The call is already durable and deterministic, so we can use it directly
        let lastSnapshot: SnapshotWithContent | null = null;
        try {
            lastSnapshot = (await this.snapshotRepository.getLastSnapshotForPage(
                pageId,
                pageURL,
                'html',
            )) as SnapshotWithContent | null;

            if (!lastSnapshot || !lastSnapshot.html) {
                return null;
            }
        } catch (error) {
            console.error(`Failed to get last snapshot for page ${pageId}:`, error);
        }

        // Step 3: Calculate diff if last snapshot exists
        let snapshotDiff: string | null = null;
        if (lastSnapshot) {
            snapshotDiff = await step.run(`calculate-diff-${pageId}`, async () => {
                try {
                    const options = {
                        properties: pageProperties.filter((prop): prop is DiffProperty =>
                            ALL_DIFF_PROPERTIES.includes(prop as DiffProperty),
                        ),
                    };

                    // In case the last snapshot is not available, we skip the diff
                    if (!lastSnapshot.html) {
                        console.error(`Last snapshot HTML is undefined for page ${pageId}`);
                        return null;
                    }

                    return await this.diffService.contentDiff(
                        lastSnapshot.html,
                        liveContent.htmlContent,
                        options,
                    );
                } catch (error) {
                    console.error(`Failed to calculate diff for page ${pageId}:`, error);
                    return null;
                }
            });
        }

        // Step 4: Create the new snapshot
        const newSnapshot = await step.run(`create-snapshot-${pageId}`, async () => {
            return await this.snapshotRepository.createSnapshotForPage(
                pageId,
                pageURL,
                liveContent.htmlContent,
                liveContent.imageContent,
                snapshotDiff ?? undefined,
            );
        });

        return newSnapshot?.id;
    }

    /**
     * Create an archive snapshot and live snapshot (durable)
     * And prepare a diff against the archive snapshot
     */
    async createArchiveSnapshotForPage(
        step: GetStepTools<typeof inngest>,
        pageId: string,
        pageProperties: string[],
        pageURL: string,
    ) {
        // Step 1: Take archive screenshot
        const { htmlContent: archiveHTMLContent } =
            await this.screenshotService.takeArchiveScreenshot(pageURL);

        // Step 2: Create archive snapshot
        await step.run(`create-archive-snapshot-${pageId}`, async () => {
            await this.snapshotRepository.createArchiveSnapshotForPage(
                pageId,
                pageURL,
                archiveHTMLContent,
            );
        });

        // Step 3: Create live snapshot
        return await this.createLiveSnapshotForPage(step, pageId, pageProperties, pageURL);
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
                    pageURL: pageWithCompany.page.url,
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

export const durableSnapshotService = DurableSnapshotService.getInstance();
