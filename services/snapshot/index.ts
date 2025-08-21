import { PaginationOptions } from '@/db/queries/types';
import { snapshotRepository, SnapshotRepository } from '@/repository/snapshot';
import { diffService, DiffService } from '@/services/diff';
import { screenshotService, ScreenshotService } from '@/services/screenshot';
import { pageQueries } from '@/db/queries/page';
import { SnapshotContent, SnapshotWithContent } from '@/types/snapshot';
import { companyQueries } from '@/db/queries/company';

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
    private async createLiveSnapshotForPage(pageId: string, userId: string, pageURL: string) {
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
        } catch (error) {
            console.error(`Failed to get last snapshot for page ${pageId}:`, error);
            return await this.snapshotRepository.createSnapshotForPage(
                pageId,
                pageURL,
                liveHTMLContent,
                liveScreenshot,
            );
        }

        // If the last snapshot does not exist, we create a new snapshot and skip the diffing
        if (!lastSnapshot || !lastSnapshot.html) {
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
            snapshotDiff = await this.diffService.contentDiff(lastSnapshot.html, liveHTMLContent);
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
    private async createArchiveSnapshotForPage(pageId: string, userId: string, pageURL: string) {
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
        return this.createLiveSnapshotForPage(pageId, userId, pageURL);
    }

    /**
     * Create a snapshot for a page
     */
    async createSnapshotForPage(pageId: string, userId: string, type: 'live' | 'archive' = 'live') {
        const page = await pageQueries.getPageById(pageId, userId);
        if (!page) {
            throw new Error('Page not found');
        }

        if (type === 'live') {
            await this.createLiveSnapshotForPage(pageId, userId, page.url);
        } else {
            await this.createArchiveSnapshotForPage(pageId, userId, page.url);
        }
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
}

export const snapshotService = SnapshotService.getInstance();
