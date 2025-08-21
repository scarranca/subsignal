import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { snapshotQueries } from '@/db/queries/snapshot';
import { PaginationOptions } from '@/db/queries/types';
import Sqids from 'sqids';
import {
    Snapshot,
    SnapshotContent,
    SnapshotWithContent,
    PartialSnapshot,
    SnapshotError,
    ResilientBatchResult,
} from '@/types/snapshot';
/**
 * SnapshotRepository class for managing snapshots with resilient batch operations
 * @description This class is used to manage snapshots for a page
 */
export class SnapshotRepository {
    private static instance: SnapshotRepository;
    private s3Client: S3Client;
    private bucketName: string;
    private sqids: Sqids;

    private constructor() {
        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.SNAPSHOT_R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.SNAPSHOT_R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.SNAPSHOT_R2_SECRET_ACCESS_KEY!,
            },
        });
        this.bucketName = process.env.SNAPSHOT_R2_BUCKET_NAME!;
        this.sqids = new Sqids({
            minLength: 10,
        });
    }

    /**
     * Get the instance of the SnapshotRepository
     * @returns The instance of the SnapshotRepository
     */
    public static getInstance(): SnapshotRepository {
        if (!SnapshotRepository.instance) {
            SnapshotRepository.instance = new SnapshotRepository();
        }
        return SnapshotRepository.instance;
    }

    /**
     * Generate a path ID for a snapshot
     * @param snapshotId - The ID of the snapshot to generate the path for
     * @returns The path ID for the snapshot
     */
    private generatePathId(snapshotId: number): string {
        // Use the integer ID directly with Sqids
        return this.sqids.encode([snapshotId]);
    }

    /**
     * Get the paths for a snapshot
     * @param snapshotId - The ID of the snapshot to get the paths for
     * @returns The paths for the snapshot
     */
    private getSnapshotPaths(snapshotId: number) {
        const pathId = this.generatePathId(snapshotId);
        return {
            html: `html/${pathId}`,
            screenshot: `screenshot/${pathId}`,
        };
    }

    /**
     * Upload a file to R2
     * @param key - The key of the file
     * @param content - The content of the file
     * @param contentType - The content type of the file
     */
    private async uploadToR2(
        key: string,
        content: string | Buffer,
        contentType: string,
    ): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: content,
            ContentType: contentType,
        });

        await this.s3Client.send(command);
    }

    /**
     * Safe content getter that returns null instead of throwing
     */
    private async getSnapshotContentSafe<T extends 'html' | 'screenshot'>(
        snapshotId: number,
        type: T,
    ): Promise<{
        content: (T extends 'html' ? string : Uint8Array) | null;
        error?: string;
    }> {
        try {
            const content = await this.getSnapshotContent(snapshotId, type);
            return { content };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Failed to load ${type} for snapshot ${snapshotId}:`, errorMessage);
            return {
                content: null,
                error: `Failed to load ${type}: ${errorMessage}`,
            };
        }
    }

    /**
     * Process a single snapshot and collect any errors
     */
    private async processSnapshotWithErrors(
        snapshot: Snapshot,
        content: 'html' | 'screenshot' | 'all',
    ): Promise<{
        snapshot: PartialSnapshot;
        errors: SnapshotError[];
    }> {
        const errors: SnapshotError[] = [];
        const processedSnapshot: PartialSnapshot = { ...snapshot };

        if (content === 'html') {
            const { content: html, error } = await this.getSnapshotContentSafe(snapshot.id, 'html');
            processedSnapshot.html = html;
            if (error) {
                errors.push({
                    snapshotId: snapshot.id,
                    field: 'html',
                    error,
                });
            }
        } else if (content === 'screenshot') {
            const { content: screenshot, error } = await this.getSnapshotContentSafe(
                snapshot.id,
                'screenshot',
            );
            processedSnapshot.screenshot = screenshot;
            if (error) {
                errors.push({
                    snapshotId: snapshot.id,
                    field: 'screenshot',
                    error,
                });
            }
        } else if (content === 'all') {
            // Process both HTML and screenshot
            const [htmlResult, screenshotResult] = await Promise.allSettled([
                this.getSnapshotContentSafe(snapshot.id, 'html'),
                this.getSnapshotContentSafe(snapshot.id, 'screenshot'),
            ]);

            // Handle HTML result
            if (htmlResult.status === 'fulfilled') {
                processedSnapshot.html = htmlResult.value.content;
                if (htmlResult.value.error) {
                    errors.push({
                        snapshotId: snapshot.id,
                        field: 'html',
                        error: htmlResult.value.error,
                    });
                }
            } else {
                processedSnapshot.html = null;
                errors.push({
                    snapshotId: snapshot.id,
                    field: 'html',
                    error: `Failed to process HTML: ${htmlResult.reason?.message || 'Unknown error'}`,
                });
            }

            // Handle screenshot result
            if (screenshotResult.status === 'fulfilled') {
                processedSnapshot.screenshot = screenshotResult.value.content;
                if (screenshotResult.value.error) {
                    errors.push({
                        snapshotId: snapshot.id,
                        field: 'screenshot',
                        error: screenshotResult.value.error,
                    });
                }
            } else {
                processedSnapshot.screenshot = null;
                errors.push({
                    snapshotId: snapshot.id,
                    field: 'screenshot',
                    error: `Failed to process screenshot: ${screenshotResult.reason?.message || 'Unknown error'}`,
                });
            }
        }

        // Add content errors summary to the snapshot for easy access
        if (errors.length > 0) {
            processedSnapshot._contentErrors = errors.map((e) => e.error);
        }

        return { snapshot: processedSnapshot, errors };
    }

    /**
     * Create a snapshot for a page
     * @param pageId - The ID of the page to create the snapshot for
     * @param diff - The diff of the snapshot
     * @param html - The HTML of the snapshot
     * @param screenshot - The screenshot of the snapshot
     * @param userId - The ID of the user to create the snapshot for
     * @returns The created snapshot
     */
    async createSnapshotForPage(
        pageId: string,
        pageURL: string,
        snapshotHTML: string,
        snapshotScreenshot?: Buffer,
        snapshotDiff?: string,
    ) {
        const snapshot = await snapshotQueries.createArchiveSnapshotsForPage(
            pageId,
            pageURL,
            snapshotDiff || '',
        );

        try {
            const paths = this.getSnapshotPaths(snapshot.id);

            // Upload screenshot if provided
            if (snapshotScreenshot) {
                await this.uploadToR2(paths.screenshot, snapshotScreenshot, 'image/png');
            }

            // Upload HTML if provided
            if (snapshotHTML) {
                await this.uploadToR2(paths.html, snapshotHTML, 'text/html');
            }

            // Return the snapshot with the paths
            return {
                ...snapshot,
            };
        } catch (error) {
            console.error('Failed to upload to R2:', error);
            throw new Error('Failed to store snapshot assets');
        }
    }

    /**
     * Create an archive snapshot for a page
     * @param pageId - The ID of the page to create the archive snapshot for
     * @param archiveHTMLContent - The HTML content of the archive snapshot
     * @param userId - The ID of the user to create the archive snapshot for
     * @returns The created archive snapshot
     */
    async createArchiveSnapshotForPage(
        pageId: string,
        pageURL: string,
        archiveHTMLContent: string,
    ) {
        return await this.createSnapshotForPage(pageId, pageURL, archiveHTMLContent);
    }

    /**
     * Get the last snapshot for a page
     * @param pageId - The ID of the page to get the last snapshot for
     * @param userId - The ID of the user to get the last snapshot for
     * @returns The last snapshot for the page
     */
    async getLastSnapshotForPage(
        pageId: string,
        pageURL: string,
        content: SnapshotContent,
    ): Promise<SnapshotWithContent | Snapshot | null> {
        const snapshot = await snapshotQueries.getLastSnapshotForPage(pageId, pageURL);

        if (!snapshot) {
            return null;
        }

        if (content === 'html') {
            return {
                ...snapshot,
                html: await this.getSnapshotContent<'html'>(snapshot.id, 'html'),
            };
        } else if (content === 'screenshot') {
            return {
                ...snapshot,
                screenshot: await this.getSnapshotContent<'screenshot'>(snapshot.id, 'screenshot'),
            };
        } else if (content === 'all') {
            return {
                ...snapshot,
                html: await this.getSnapshotContent<'html'>(snapshot.id, 'html'),
                screenshot: await this.getSnapshotContent<'screenshot'>(snapshot.id, 'screenshot'),
            };
        }

        return snapshot;
    }

    /**
     * List snapshots for a page with resilient error handling
     * @param pageId - The ID of the page to list snapshots for
     * @param pageURL - The URL of the page to list snapshots for
     * @param content - The content to get for the snapshots
     * @param options - The options for the pagination
     * @returns The snapshots for the page with error information
     */
    async listSnapshotsForPage(
        pageId: string,
        pageURL: string,
        content: 'html' | 'screenshot' | 'diff' | 'all' = 'all',
        options: PaginationOptions = {},
    ): Promise<
        ResilientBatchResult<PartialSnapshot> & {
            total: number;
            hasMore: boolean;
        }
    > {
        const results = await snapshotQueries.listSnapshotsForPage(pageId, pageURL, options);

        // If only diff is requested, no S3 operations needed
        if (content === 'diff') {
            return {
                data: results.data,
                errors: [],
                totalRequested: results.data.length,
                successfullyProcessed: results.data.length,
                total: results.pagination.totalItems,
                hasMore: results.pagination.hasNext,
            };
        }

        // Process all snapshots and collect errors
        const processResults = await Promise.allSettled(
            results.data.map((snapshot) => this.processSnapshotWithErrors(snapshot, content)),
        );

        const processedSnapshots: PartialSnapshot[] = [];
        const allErrors: SnapshotError[] = [];

        processResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                processedSnapshots.push(result.value.snapshot);
                allErrors.push(...result.value.errors);
            } else {
                // Even if processing completely fails, include the basic snapshot data
                const originalSnapshot = results.data[index];
                processedSnapshots.push({
                    ...originalSnapshot,
                    _contentErrors: [
                        `Complete processing failure: ${result.reason?.message || 'Unknown error'}`,
                    ],
                });
                allErrors.push({
                    snapshotId: originalSnapshot.id,
                    field: content === 'html' ? 'html' : 'screenshot',
                    error: `Processing failed: ${result.reason?.message || 'Unknown error'}`,
                });
            }
        });

        return {
            data: processedSnapshots,
            errors: allErrors,
            totalRequested: results.data.length,
            successfullyProcessed: processedSnapshots.filter((s) => !s._contentErrors).length,
            total: results.pagination.totalItems,
            hasMore: results.pagination.hasNext,
        };
    }

    /**
     * Get the last snapshots for multiple pages with resilient error handling
     * @param pageIds - The IDs of the pages to get the last snapshots for
     * @param content - The content to get for the snapshots
     * @returns The last snapshots for the pages with error information
     */
    async getLastSnapshotsForPages(
        pageIds: string[],
        content: 'html' | 'screenshot' | 'diff' | 'all' = 'all',
    ): Promise<ResilientBatchResult<PartialSnapshot>> {
        const snapshots = await snapshotQueries.getLastSnapshotsForPages(pageIds);

        if (content === 'diff') {
            return {
                data: snapshots,
                errors: [],
                totalRequested: snapshots.length,
                successfullyProcessed: snapshots.length,
            };
        }

        const processResults = await Promise.allSettled(
            snapshots.map((snapshot) => this.processSnapshotWithErrors(snapshot, content)),
        );

        const processedSnapshots: PartialSnapshot[] = [];
        const allErrors: SnapshotError[] = [];

        processResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                processedSnapshots.push(result.value.snapshot);
                allErrors.push(...result.value.errors);
            } else {
                const originalSnapshot = snapshots[index];
                processedSnapshots.push({
                    ...originalSnapshot,
                    _contentErrors: [
                        `Complete processing failure: ${result.reason?.message || 'Unknown error'}`,
                    ],
                });
                allErrors.push({
                    snapshotId: originalSnapshot.id,
                    field: content === 'html' ? 'html' : 'screenshot',
                    error: `Processing failed: ${result.reason?.message || 'Unknown error'}`,
                });
            }
        });

        return {
            data: processedSnapshots,
            errors: allErrors,
            totalRequested: snapshots.length,
            successfullyProcessed: processedSnapshots.filter((s) => !s._contentErrors).length,
        };
    }

    /**
     * Get the last snapshots for a company with resilient error handling
     * @param companyId - The ID of the company to get the last snapshots for
     * @param content - The content to get for the snapshots
     * @returns The last snapshots for the company with error information
     */
    async getLastSnapshotsForCompany(
        companyId: string,
        content: 'html' | 'screenshot' | 'diff' | 'all' = 'all',
    ): Promise<ResilientBatchResult<PartialSnapshot>> {
        const snapshots = await snapshotQueries.getLastSnapshotsForCompany(companyId);

        if (content === 'diff') {
            return {
                data: snapshots,
                errors: [],
                totalRequested: snapshots.length,
                successfullyProcessed: snapshots.length,
            };
        }

        const processResults = await Promise.allSettled(
            snapshots.map((snapshot) => this.processSnapshotWithErrors(snapshot, content)),
        );

        const processedSnapshots: PartialSnapshot[] = [];
        const allErrors: SnapshotError[] = [];

        processResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                processedSnapshots.push(result.value.snapshot);
                allErrors.push(...result.value.errors);
            } else {
                const originalSnapshot = snapshots[index];
                processedSnapshots.push({
                    ...originalSnapshot,
                    _contentErrors: [
                        `Complete processing failure: ${result.reason?.message || 'Unknown error'}`,
                    ],
                });
                allErrors.push({
                    snapshotId: originalSnapshot.id,
                    field: content === 'html' ? 'html' : 'screenshot',
                    error: `Processing failed: ${result.reason?.message || 'Unknown error'}`,
                });
            }
        });

        return {
            data: processedSnapshots,
            errors: allErrors,
            totalRequested: snapshots.length,
            successfullyProcessed: processedSnapshots.filter((s) => !s._contentErrors).length,
        };
    }

    /**
     * Get the content of a snapshot (used for single operations)
     * @param snapshotId - The ID of the snapshot to get the content for
     * @param type - The type of content to get ('html' or 'screenshot')
     * @returns The content of the snapshot
     */
    private async getSnapshotContent<T extends 'html' | 'screenshot'>(
        snapshotId: number,
        type: T,
    ): Promise<T extends 'html' ? string : Uint8Array> {
        const { html: htmlKey, screenshot: screenshotKey } = this.getSnapshotPaths(snapshotId);
        const key = type === 'html' ? htmlKey : screenshotKey;

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new Error(`No content found for ${type}`);
            }

            if (type === 'html') {
                return (await response.Body.transformToString()) as T extends 'html'
                    ? string
                    : Uint8Array;
            } else {
                // For screenshots (PNG images)
                if (response.ContentType && !response.ContentType.includes('image')) {
                    throw new Error(`Invalid content type for screenshot: ${response.ContentType}`);
                }

                // Get image as Uint8Array for efficient binary handling
                const imageData = await response.Body.transformToByteArray();
                if (!imageData.length) {
                    throw new Error('Screenshot data is empty');
                }
                return imageData as T extends 'html' ? string : Uint8Array;
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Failed to get ${type} content:`, error.message);
                throw error;
            }
            console.error(`Failed to get ${type} content:`, error);
            throw new Error(`Failed to retrieve ${type} content`);
        }
    }
}

export const snapshotRepository = SnapshotRepository.getInstance();
