import { subDays, format } from 'date-fns';
import { ArchiveScreenshotResult } from '@/types/screenshot';

/**
 * Archive Screenshot Service - provides archive content from Internet Archive
 */
export class ArchiveScreenshotService {
    // Singleton instance
    private static instance: ArchiveScreenshotService;

    private baseCDX = 'https://web.archive.org/cdx/search/cdx';

    private constructor() {}

    /**
     * Get the singleton instance of ArchiveScreenshotService
     */
    public static getInstance(): ArchiveScreenshotService {
        if (!ArchiveScreenshotService.instance) {
            ArchiveScreenshotService.instance = new ArchiveScreenshotService();
        }
        return ArchiveScreenshotService.instance;
    }

    private getDateRange(days: number) {
        if (days < 0) throw new Error('Days must be non-negative');
        if (days > 3650) throw new Error('Days cannot exceed 10 years'); // reasonable limit

        const end = new Date();
        const start = subDays(end, days);

        const fmt = (d: Date) => format(d, 'yyyyMMddHHmmss');

        return { from: fmt(start), to: fmt(end) };
    }

    private async queryCDX(url: string, from: string, to: string) {
        const query = `${this.baseCDX}?url=${encodeURIComponent(
            url,
        )}&output=json&from=${from}&to=${to}&filter=statuscode:200&filter=mimetype:text/html`;
        const res = await fetch(query);
        if (!res.ok) throw new Error(`CDX API failed: ${res.statusText}`);
        return (await res.json()) as any[];
    }

    private buildSnapshotUrl(timestamp: string, original: string) {
        return `https://web.archive.org/web/${timestamp}id_/${original}`;
    }

    private async trySnapshots(
        rows: any[],
        maxTries = 3,
    ): Promise<{ html: string; timestamp: string; original: string } | null> {
        for (let i = 0; i < Math.min(rows.length, maxTries); i++) {
            const [, timestamp, original] = rows[i];
            const snapshotUrl = this.buildSnapshotUrl(timestamp, original);
            try {
                const htmlRes = await fetch(snapshotUrl);
                if (htmlRes.ok) {
                    const html = await htmlRes.text();
                    return { html, timestamp, original };
                }
            } catch (err) {
                console.warn(`Failed snapshot ${timestamp}:`, err);
            }
        }
        return null;
    }

    /**
     * Gets the most recent working snapshot
     * Tries last 90 days (oldest 3 snapshots), then last 180 days (oldest 3 snapshots)
     */
    private async getMostRecentSnapshot(url: string): Promise<ArchiveScreenshotResult> {
        // Step 1: try last 90 days, oldest 3 snapshots
        const { from: from90, to: to90 } = this.getDateRange(90);
        let results = await this.queryCDX(url, from90, to90);

        if (results.length > 1) {
            const [, ...rows] = results;
            // Sort by timestamp (oldest first) and try the oldest 3
            const sortedRows = rows.sort((a, b) => a[1].localeCompare(b[1]));
            const snapshot = await this.trySnapshots(sortedRows, 3);
            if (snapshot) {
                return {
                    htmlContent: snapshot.html,
                };
            }
        }

        // Step 2: try last 180 days, oldest 3 snapshots
        const { from: from180, to: to180 } = this.getDateRange(180);
        results = await this.queryCDX(url, from180, to180);

        if (results.length > 1) {
            const [, ...rows] = results;
            // Sort by timestamp (oldest first) and try the oldest 3
            const sortedRows = rows.sort((a, b) => a[1].localeCompare(b[1]));
            const snapshot = await this.trySnapshots(sortedRows, 3);
            if (snapshot) {
                return {
                    htmlContent: snapshot.html,
                };
            }
        }

        throw new Error('No working snapshots found');
    }

    /**
     * Takes a screenshot of the most recent snapshot
     */
    async takeScreenshot(url: string): Promise<ArchiveScreenshotResult> {
        return this.getMostRecentSnapshot(url);
    }
}
