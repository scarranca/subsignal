import {
    Briefing,
    BriefingContent,
    BriefingEmailProps,
    BriefingWithContent,
} from '@/types/briefing';
import { briefingRepository } from '@/repository/briefing';
import { snapshotQueries } from '@/db/queries/snapshot';
import { pageQueries } from '@/db/queries/page';
import { page } from '@/db/schema/page';
import { snapshot } from '@/db/schema/snapshot';
import { reportService } from '@/services/report';
import * as yaml from 'js-yaml';

export class BriefingService {
    private static instance: BriefingService;
    private reportService = reportService;

    private constructor() {}

    public static getInstance(): BriefingService {
        if (!BriefingService.instance) {
            BriefingService.instance = new BriefingService();
        }
        return BriefingService.instance;
    }

    /**
     * Helper method to get all active pages for a company using pagination
     * @param companyId - The ID of the company
     * @param pageSize - Number of pages to fetch per batch (default: 50)
     * @returns All active pages for the company
     */
    private async getAllActivePagesByCompany(
        companyId: string,
        pageSize: number = 50,
    ): Promise<Array<typeof page.$inferSelect>> {
        const allPages: Array<typeof page.$inferSelect> = [];
        let currentPage = 1;
        let hasNext = true;

        console.log(
            `Fetching all active pages for company ${companyId} using pagination (pageSize: ${pageSize})`,
        );

        while (hasNext) {
            console.log(`Fetching page ${currentPage}...`);

            const pagesResult = await pageQueries.getActivePagesByCompany(companyId, {
                page: currentPage,
                pageSize,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });

            allPages.push(...pagesResult.data);
            hasNext = pagesResult.pagination.hasNext;
            currentPage++;

            console.log(
                `Fetched ${pagesResult.data.length} pages. Total so far: ${allPages.length}. Has next: ${hasNext}`,
            );
        }

        console.log(`Completed pagination. Total pages fetched: ${allPages.length}`);
        return allPages;
    }

    /**
     * Helper method to get latest snapshots for pages using batching
     * @param pageIds - Array of page IDs to get snapshots for
     * @param batchSize - Number of page IDs to process per batch (default: 100)
     * @returns All latest snapshots for the provided page IDs
     */
    private async getAllLatestSnapshotsForPages(
        pageIds: string[],
        batchSize: number = 100,
    ): Promise<Array<typeof snapshot.$inferSelect>> {
        if (pageIds.length === 0) {
            return [];
        }

        const allSnapshots: Array<typeof snapshot.$inferSelect> = [];
        const totalBatches = Math.ceil(pageIds.length / batchSize);

        console.log(
            `Fetching snapshots for ${pageIds.length} pages using ${totalBatches} batches (batchSize: ${batchSize})`,
        );

        // Process pageIds in batches
        for (let i = 0; i < pageIds.length; i += batchSize) {
            const currentBatch = i / batchSize + 1;
            const batch = pageIds.slice(i, i + batchSize);

            console.log(
                `Fetching snapshots batch ${currentBatch}/${totalBatches} (${batch.length} page IDs)...`,
            );

            const batchSnapshots = await snapshotQueries.getLastSnapshotsForPages(batch);
            allSnapshots.push(...batchSnapshots);

            console.log(
                `Batch ${currentBatch} completed. Fetched ${batchSnapshots.length} snapshots. Total so far: ${allSnapshots.length}`,
            );
        }

        console.log(`Completed snapshot batching. Total snapshots fetched: ${allSnapshots.length}`);
        return allSnapshots;
    }

    /**
     * Helper method to create an empty briefing for no-data scenarios
     * @param companyId - The ID of the company
     * @param companyUrl - The URL of the company
     * @param companyName - The name of the company
     * @param frequency - The briefing frequency
     * @returns The created empty briefing
     */
    private async createEmptyBriefing(
        companyId: string,
        companyUrl: string,
        companyName: string,
        frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month',
    ): Promise<Briefing> {
        const emptyBriefing = this.reportService.generateEmptyBriefing(companyName, frequency);

        const briefingYaml = yaml.dump(emptyBriefing.data || {});
        const briefingHtml = await this.reportService.renderBriefingAsHtml(
            emptyBriefing.data || {},
            companyName,
            frequency,
            emptyBriefing.generatedAt,
        );

        return await briefingRepository.createBriefingForCompany(
            companyId,
            companyUrl,
            briefingYaml,
            briefingHtml,
        );
    }

    /**
     * Helper method to filter snapshots by properties and convert to YAML inputs
     * @param snapshots - Array of snapshots to filter
     * @param properties - Array of property keys to include in the filtered YAML
     * @returns Object with pageURL as keys and filtered YAML content as values
     */
    private filterSnapshotsByProperties(
        snapshots: Array<typeof snapshot.$inferSelect>,
        properties: string[],
    ): Record<string, string> {
        const yamlInputs: Record<string, string> = {};

        for (const snapshot of snapshots) {
            const pageUrl = snapshot.pageURL;

            // Parse YAML diff and filter by properties
            if (snapshot.diff && snapshot.diff.trim()) {
                try {
                    const parsedYaml = yaml.load(snapshot.diff) as any;

                    if (parsedYaml && typeof parsedYaml === 'object') {
                        // Filter YAML to only include keys that are in properties list
                        const filteredYaml: any = {};
                        for (const property of properties) {
                            if (parsedYaml[property] !== undefined) {
                                filteredYaml[property] = parsedYaml[property];
                            }
                        }

                        // Only add if there are matching properties
                        if (Object.keys(filteredYaml).length > 0) {
                            yamlInputs[pageUrl] = yaml.dump(filteredYaml);
                        }
                    }
                } catch (parseError) {
                    console.error(`Error parsing YAML for URL ${pageUrl}:`, parseError);
                    // Skip this snapshot if YAML parsing fails
                }
            }
        }

        return yamlInputs;
    }

    /**
     * Create a briefing for a company by getting all pages and concatenating their latest snapshot diffs
     * @param companyId - The ID of the company
     * @param companyUrl - The URL of the company
     * @returns The created briefing
     */
    async createBriefingForCompany(
        companyId: string,
        companyUrl: string,
        companyName: string,
        properties: string[],
        frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month',
    ): Promise<Briefing> {
        console.log(
            'createBriefingForCompany',
            companyId,
            companyUrl,
            companyName,
            properties,
            frequency,
        );
        // Get all active pages for the company using pagination
        const pages = await this.getAllActivePagesByCompany(companyId);

        // If no pages are found, create empty briefing (let email template handle fallback UI)
        if (pages.length === 0) {
            return await this.createEmptyBriefing(companyId, companyUrl, companyName, frequency);
        }

        // Get the latest snapshots for all pages using batching
        const pageIds = pages.map((page: any) => page.id);
        const allLatestSnapshots = await this.getAllLatestSnapshotsForPages(pageIds);

        // Filter snapshots to only those that match either page ID or page URL from pagesResult
        const pageIdSet = new Set(pages.map((page: any) => page.id));
        const pageUrlSet = new Set(pages.map((page: any) => page.url));

        // Filter snapshots to only those that match either page ID or page URL from pagesResult
        const filteredSnapshots = allLatestSnapshots.filter((snapshot: any) => {
            return pageIdSet.has(snapshot.pageId) || pageUrlSet.has(snapshot.pageURL);
        });

        // If no snapshots are found, create empty briefing (let email template handle fallback UI)
        if (filteredSnapshots.length === 0) {
            return await this.createEmptyBriefing(companyId, companyUrl, companyName, frequency);
        }

        // Transform snapshots into YAML inputs for generateBriefing
        const yamlInputs = this.filterSnapshotsByProperties(filteredSnapshots, properties);

        console.log('yamlInputs', yamlInputs);

        // Generate structured briefing using embedded report service
        const briefingResult = await this.reportService.generateBriefing(
            yamlInputs,
            companyName,
            frequency,
        );

        console.log('briefingResult', briefingResult);

        // Store briefing result as YAML and prepare HTML content
        const briefingYaml = yaml.dump(briefingResult.data || {});

        console.log('briefingYaml', briefingYaml);

        const briefingHtml = await this.reportService.renderBriefingAsHtml(
            briefingResult.data || {},
            companyName,
            frequency,
            new Date().toISOString(),
        );

        console.log('briefingHtml', briefingHtml);

        return await briefingRepository.createBriefingForCompany(
            companyId,
            companyUrl,
            briefingYaml,
            briefingHtml,
        );
    }

    async getLatestBriefingForCompany(
        companyId: string,
        content: BriefingContent = 'all',
    ): Promise<BriefingWithContent | Briefing | null> {
        console.log('Getting latest briefing for company', companyId);
        return await briefingRepository.getLastBriefingForCompany(companyId, content);
    }
}

export const briefingService = BriefingService.getInstance();
