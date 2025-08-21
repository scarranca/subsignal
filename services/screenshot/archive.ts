import { subDays, format } from 'date-fns';
import { NonRetriableError, RetryAfterError } from 'inngest';
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
        if (days < 0) throw new NonRetriableError('Days must be non-negative');
        if (days > 3650) throw new NonRetriableError('Days cannot exceed 10 years'); // reasonable limit

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

        if (!res.ok) {
            const errorText = await res.text();

            // Handle CDX API errors by status code
            switch (res.status) {
                // 4xx - Client errors (non-retriable)
                case 400: // Bad request - malformed URL or parameters
                case 404: // Not found - URL never archived
                case 422: // Unprocessable entity - invalid parameters
                    throw new NonRetriableError(
                        `CDX API client error (${res.status}): ${errorText}`,
                    );

                // 429 - Rate limiting
                case 429: {
                    const retryAfter = res.headers.get('Retry-After');
                    if (retryAfter) {
                        const retryDelay = /^\d+$/.test(retryAfter) ? `${retryAfter}s` : retryAfter;
                        throw new RetryAfterError(`CDX API rate limited: ${errorText}`, retryDelay);
                    }
                    // Internet Archive typically has longer rate limits
                    throw new RetryAfterError(`CDX API rate limited: ${errorText}`, '300s');
                }

                // 5xx - Server errors (retriable)
                case 500:
                case 502:
                case 503:
                case 504:
                    throw new Error(`CDX API server error (${res.status}): ${errorText}`);

                default:
                    throw new Error(`CDX API failed (${res.status}): ${errorText}`);
            }
        }

        try {
            return (await res.json()) as any[];
        } catch (parseError) {
            throw new Error(`CDX API returned invalid JSON: ${parseError}`);
        }
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

                if (!htmlRes.ok) {
                    const errorText = await htmlRes.text();

                    // Handle snapshot fetch errors
                    switch (htmlRes.status) {
                        case 404:
                            // Snapshot not found - try next one
                            console.warn(`Snapshot ${timestamp} not found, trying next...`);
                            continue;

                        case 429: {
                            const retryAfter = htmlRes.headers.get('Retry-After');
                            if (retryAfter) {
                                const retryDelay = /^\d+$/.test(retryAfter)
                                    ? `${retryAfter}s`
                                    : retryAfter;
                                throw new RetryAfterError(
                                    `Archive snapshot rate limited: ${errorText}`,
                                    retryDelay,
                                );
                            }
                            throw new RetryAfterError(
                                `Archive snapshot rate limited: ${errorText}`,
                                '300s',
                            );
                        }

                        case 500:
                        case 502:
                        case 503:
                        case 504:
                            // Server errors - might work for other snapshots or later
                            console.warn(
                                `Snapshot ${timestamp} server error (${htmlRes.status}), trying next...`,
                            );
                            continue;

                        default:
                            console.warn(
                                `Snapshot ${timestamp} failed (${htmlRes.status}), trying next...`,
                            );
                            continue;
                    }
                }

                try {
                    const html = await htmlRes.text();
                    return { html, timestamp, original };
                } catch (textError) {
                    console.warn(`Failed to read snapshot ${timestamp} content:`, textError);
                    continue;
                }
            } catch (err) {
                console.warn(`Failed snapshot ${timestamp}:`, err);
                continue;
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
        try {
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
        } catch (error) {
            // If it's a non-retriable error or rate limit, propagate it
            if (error instanceof NonRetriableError || error instanceof RetryAfterError) {
                throw error;
            }
            // Otherwise, continue to try 180 days
            console.warn('90-day search failed, trying 180 days:', error);
        }

        // Step 2: try last 180 days, oldest 3 snapshots
        try {
            const { from: from180, to: to180 } = this.getDateRange(180);
            const results = await this.queryCDX(url, from180, to180);

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
        } catch (error) {
            // If it's a non-retriable error or rate limit, propagate it
            if (error instanceof NonRetriableError || error instanceof RetryAfterError) {
                throw error;
            }
            // Otherwise, treat as temporary failure
            throw new Error(
                `Archive search failed: ${error instanceof Error ? error.message : error}`,
            );
        }

        // No snapshots found in either timeframe
        throw new NonRetriableError('No working snapshots found in the last 180 days');
    }

    /**
     * Takes a screenshot of the most recent snapshot in the last 90 or 180 days
     */
    async takeScreenshot(url: string): Promise<ArchiveScreenshotResult> {
        // Validate URL format
        try {
            new URL(url);
        } catch {
            throw new NonRetriableError(`Invalid URL format: ${url}`);
        }

        return this.getMostRecentSnapshot(url);
    }
}
