import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { snapshotQueries } from '@/db/queries/snapshot';
import { PaginationOptions } from '@/db/queries/types';
import Sqids from 'sqids';
import { Snapshot, SnapshotContent, SnapshotWithContent } from '@/types/snapshot';

/**
 * SnapshotRepository class for managing snapshots
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
     * List snapshots for a page
     * @param pageId - The ID of the page to list snapshots for
     * @param pageURL - The URL of the page to list snapshots for
     * @param content - The content to get for the snapshots
     * @param options - The options for the pagination
     * @returns The snapshots for the page
     */
    async listSnapshotsForPage(
        pageId: string,
        pageURL: string,
        content: 'html' | 'screenshot' | 'diff' | 'all' = 'all',
        options: PaginationOptions = {},
    ) {
        const results = await snapshotQueries.listSnapshotsForPage(pageId, pageURL, options);

        const snapshotsWithContent = await Promise.all(
            results.data.map(async (snapshot) => {
                if (content === 'html') {
                    return {
                        ...snapshot,
                        html: await this.getSnapshotContent<'html'>(snapshot.id, 'html'),
                    };
                } else if (content === 'screenshot') {
                    return {
                        ...snapshot,
                        screenshot: await this.getSnapshotContent<'screenshot'>(
                            snapshot.id,
                            'screenshot',
                        ),
                    };
                } else if (content === 'diff') {
                    return snapshot;
                } else {
                    const [html, screenshot] = await Promise.all([
                        this.getSnapshotContent(snapshot.id, 'html'),
                        this.getSnapshotContent(snapshot.id, 'screenshot'),
                    ]);

                    return {
                        ...snapshot,
                        html,
                        screenshot,
                    };
                }
            }),
        );

        return {
            ...results,
            data: snapshotsWithContent,
        };
    }

    /**
     * Get the last snapshots for a page
     * @param pageIds - The IDs of the pages to get the last snapshots for
     * @param content - The content to get for the snapshots
     * @returns The last snapshots for the pages
     */
    async getLastSnapshotsForPages(
        pageIds: string[],
        content: 'html' | 'screenshot' | 'diff' | 'all' = 'all',
    ) {
        const snapshots = await snapshotQueries.getLastSnapshotsForPages(pageIds);

        if (content === 'diff') {
            return snapshots;
        }

        const snapshotsWithContent = await Promise.all(
            snapshots.map(async (snapshot) => {
                if (content === 'html') {
                    return {
                        ...snapshot,
                        html: await this.getSnapshotContent<'html'>(snapshot.id, 'html'),
                    };
                } else if (content === 'screenshot') {
                    return {
                        ...snapshot,
                        screenshot: await this.getSnapshotContent<'screenshot'>(
                            snapshot.id,
                            'screenshot',
                        ),
                    };
                } else {
                    const [html, screenshot] = await Promise.all([
                        this.getSnapshotContent(snapshot.id, 'html'),
                        this.getSnapshotContent(snapshot.id, 'screenshot'),
                    ]);

                    return {
                        ...snapshot,
                        html,
                        screenshot,
                    };
                }
            }),
        );

        return snapshotsWithContent;
    }

    /**
     * Get the last snapshots for a company
     * @param companyId - The ID of the company to get the last snapshots for
     * @param content - The content to get for the snapshots
     * @returns The last snapshots for the company
     */
    async getLastSnapshotsForCompany(
        companyId: string,
        content: 'html' | 'screenshot' | 'diff' | 'all' = 'all',
    ) {
        const snapshots = await snapshotQueries.getLastSnapshotsForCompany(companyId);

        if (content === 'diff') {
            return snapshots;
        }

        const snapshotsWithContent = await Promise.all(
            snapshots.map(async (snapshot) => {
                if (content === 'html') {
                    return {
                        ...snapshot,
                        html: await this.getSnapshotContent<'html'>(snapshot.id, 'html'),
                    };
                } else if (content === 'screenshot') {
                    return {
                        ...snapshot,
                        screenshot: await this.getSnapshotContent<'screenshot'>(
                            snapshot.id,
                            'screenshot',
                        ),
                    };
                } else {
                    const [html, screenshot] = await Promise.all([
                        this.getSnapshotContent(snapshot.id, 'html'),
                        this.getSnapshotContent(snapshot.id, 'screenshot'),
                    ]);

                    return {
                        ...snapshot,
                        html,
                        screenshot,
                    };
                }
            }),
        );

        return snapshotsWithContent;
    }

    /**
     * Get the content of a snapshot
     * @param snapshotId - The ID of the snapshot to get the content for
     * @param type - The type of content to get ('html' or 'screenshot')
     * @param userId - The ID of the user to get the content for
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
