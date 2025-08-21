import { PaginationOptions } from '@/db/queries/types';
import { snapshotRepository, SnapshotRepository } from '@/repository/snapshot';
import { diffService, DiffService } from '@/services/diff';
import { screenshotService, ScreenshotService } from '@/services/screenshot';
import { pageQueries } from '@/db/queries/page';
import { SnapshotContent } from '@/types/snapshot';
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
