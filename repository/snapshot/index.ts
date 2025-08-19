import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { snapshotQueries } from '@/db/queries/snapshot';
import { PaginationOptions } from '@/db/queries/types';
import Sqids from 'sqids';

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
        diff: string,
        html: string,
        screenshot: Buffer,
        userId: string,
    ) {
        const snapshot = await snapshotQueries.createSnapshot(pageId, diff, userId);

        try {
            const paths = this.getSnapshotPaths(snapshot.id);
            await Promise.all([
                this.uploadToR2(paths.html, html, 'text/html'),
                this.uploadToR2(paths.screenshot, screenshot, 'image/png'),
            ]);

            return {
                ...snapshot,
                htmlUrl: paths.html,
                screenshotUrl: paths.screenshot,
            };
        } catch (error) {
            console.error('Failed to upload to R2:', error);
            throw new Error('Failed to store snapshot assets');
        }
    }

    /**
     * Get the last snapshot for a page
     * @param pageId - The ID of the page to get the last snapshot for
     * @param userId - The ID of the user to get the last snapshot for
     * @returns The last snapshot for the page
     */
    async getLastSnapshotForPage(pageId: string, userId: string) {
        const snapshot = await snapshotQueries.getLastSnapshotForPage(pageId, userId);

        if (!snapshot) {
            return null;
        }

        const paths = this.getSnapshotPaths(snapshot.id);
        return {
            ...snapshot,
            htmlUrl: paths.html,
            screenshotUrl: paths.screenshot,
        };
    }

    /**
     * List snapshots for a page
     * @param pageId - The ID of the page to list snapshots for
     * @param userId - The ID of the user to list snapshots for
     * @param options - The options for the pagination
     * @returns The snapshots for the page
     */
    async listSnapshotsForPage(pageId: string, userId: string, options: PaginationOptions = {}) {
        const result = await snapshotQueries.listSnapshotsForPage(pageId, userId, options);

        return {
            ...result,
            data: result.data.map((snapshot) => {
                const paths = this.getSnapshotPaths(snapshot.id);
                return {
                    ...snapshot,
                    htmlUrl: paths.html,
                    screenshotUrl: paths.screenshot,
                };
            }),
        };
    }

    /**
     * Get the last snapshots for a page
     * @param pageIds - The IDs of the pages to get the last snapshots for
     * @param userId - The ID of the user to get the last snapshots for
     * @returns The last snapshots for the pages
     */
    async getLastSnapshotsForPages(pageIds: string[], userId: string) {
        const snapshots = await snapshotQueries.getLastSnapshotsForPages(pageIds, userId);
        return snapshots;
    }

    /**
     * Get the last snapshots for a company
     * @param companyId - The ID of the company to get the last snapshots for
     * @param userId - The ID of the user to get the last snapshots for
     * @returns The last snapshots for the company
     */
    async getLastSnapshotsForCompany(companyId: string, userId: string) {
        const snapshots = await snapshotQueries.getLastSnapshotsForCompany(companyId, userId);
        return snapshots;
    }

    /**
     * Get the content of a snapshot
     * @param snapshotId - The ID of the snapshot to get the content for
     * @param type - The type of content to get ('html' or 'screenshot')
     * @param userId - The ID of the user to get the content for
     * @returns The content of the snapshot
     */
    async getSnapshotContent(snapshotId: number, type: 'html' | 'screenshot', userId?: string) {
        // Get snapshot to find id - userId is optional for internal use
        const snapshot = await snapshotQueries.getSnapshotById(snapshotId, userId || '');
        const { html: htmlKey, screenshot: screenshotKey } = this.getSnapshotPaths(snapshot.id);
        const key = type === 'html' ? htmlKey : screenshotKey;

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            if (type === 'html') {
                return await response.Body?.transformToString();
            } else {
                return await response.Body?.transformToByteArray();
            }
        } catch (error) {
            console.error(`Failed to get ${type} content:`, error);
            throw new Error(`Failed to retrieve ${type} content`);
        }
    }

    /**
     * Delete a snapshot
     * @param snapshotId - The ID of the snapshot to delete
     * @param userId - The ID of the user to delete the snapshot
     * @returns The ID of the deleted snapshot
     */
    async deleteSnapshot(snapshotId: number, userId: string) {
        // Get snapshot to find id and verify permissions
        const snapshot = await snapshotQueries.getSnapshotById(snapshotId, userId);

        try {
            // Delete from R2 first
            const { html: htmlKey, screenshot: screenshotKey } = this.getSnapshotPaths(snapshot.id);
            await Promise.all([
                this.s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: this.bucketName,
                        Key: htmlKey,
                    }),
                ),
                this.s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: this.bucketName,
                        Key: screenshotKey,
                    }),
                ),
            ]);

            // Then delete from database
            await snapshotQueries.deleteSnapshotById(snapshotId, userId);

            return { success: true, deletedId: snapshotId };
        } catch (error) {
            console.error('Failed to delete snapshot:', error);
            throw new Error('Failed to delete snapshot');
        }
    }

    /**
     * Get the image for a snapshot
     * @param snapshotId - The ID of the snapshot to get the image for
     * @param userId - The ID of the user to get the image for
     * @returns The image for the snapshot
     */
    async getSnapshotImage(snapshotId: number, userId: string) {
        // Verify snapshot exists and belongs to user
        await snapshotQueries.getSnapshotById(snapshotId, userId);
        return await this.getSnapshotContent(snapshotId, 'screenshot');
    }

    /**
     * Get the HTML for a snapshot
     * @param snapshotId - The ID of the snapshot to get the HTML for
     * @param userId - The ID of the user to get the HTML for
     * @returns The HTML for the snapshot
     */
    async getSnapshotHtml(snapshotId: number, userId: string) {
        // Verify snapshot exists and belongs to user
        await snapshotQueries.getSnapshotById(snapshotId, userId);
        return await this.getSnapshotContent(snapshotId, 'html');
    }

    /**
     * Get the diff for a snapshot
     * @param snapshotId - The ID of the snapshot to get the diff for
     * @param userId - The ID of the user to get the diff for
     * @returns The diff for the snapshot
     */
    async getSnapshotDiff(snapshotId: number, userId: string) {
        // Get the specific snapshot and verify authorization
        const snapshot = await snapshotQueries.getSnapshotById(snapshotId, userId);
        return snapshot.diff;
    }

    // Last snapshot content by page
    /**
     * Get the image for the last snapshot for a page
     * @param pageId - The ID of the page to get the image for
     * @param userId - The ID of the user to get the image for
     * @returns The image for the last snapshot for the page
     */
    async getLastSnapshotImageForPage(pageId: string, userId: string) {
        const snapshot = await this.getLastSnapshotForPage(pageId, userId);
        if (!snapshot) return null;
        return await this.getSnapshotContent(snapshot.id, 'screenshot');
    }

    /**
     * Get the HTML for the last snapshot for a page
     * @param pageId - The ID of the page to get the HTML for
     * @param userId - The ID of the user to get the HTML for
     * @returns The HTML for the last snapshot for the page
     */
    async getLastSnapshotHtmlForPage(pageId: string, userId: string) {
        const snapshot = await this.getLastSnapshotForPage(pageId, userId);
        if (!snapshot) return null;
        return await this.getSnapshotContent(snapshot.id, 'html');
    }

    /**
     * Get the diff for the last snapshot for a page
     * @param pageId - The ID of the page to get the diff for
     * @param userId - The ID of the user to get the diff for
     * @returns The diff for the last snapshot for the page
     */
    async getLastSnapshotDiffForPage(pageId: string, userId: string) {
        const snapshot = await this.getLastSnapshotForPage(pageId, userId);
        return snapshot?.diff || null;
    }

    // Last snapshot content by company
    /**
     * Get the image for the last snapshot for each page
     * @param companyId - The ID of the company to get the image for
     * @param userId - The ID of the user to get the image for
     * @returns The image for the last snapshot for each page
     */
    async getLastSnapshotImagesForCompany(companyId: string, userId: string) {
        const snapshots = await this.getLastSnapshotsForCompany(companyId, userId);

        const imagePromises = snapshots.map(async (item) => ({
            pageId: item.pageId,
            image: await this.getSnapshotContent(item.id, 'screenshot'),
        }));

        return await Promise.all(imagePromises);
    }

    /**
     * Get the HTML for the last snapshot for each page
     * @param companyId - The ID of the company to get the HTML for
     * @param userId - The ID of the user to get the HTML for
     * @returns The HTML for the last snapshot for each page
     */
    async getLastSnapshotHtmlsForCompany(companyId: string, userId: string) {
        const snapshots = await this.getLastSnapshotsForCompany(companyId, userId);

        const htmlPromises = snapshots.map(async (item) => ({
            pageId: item.pageId,
            html: await this.getSnapshotContent(item.id, 'html'),
        }));

        return await Promise.all(htmlPromises);
    }

    /**
     * Get the diff for the last snapshot for each page
     * @param companyId - The ID of the company to get the diff for
     * @param userId - The ID of the user to get the diff for
     * @returns The diff for the last snapshot for each page
     */
    async getLastSnapshotDiffsForCompany(companyId: string, userId: string) {
        const snapshots = await this.getLastSnapshotsForCompany(companyId, userId);

        return snapshots.map((item) => ({
            pageId: item.pageId,
            diff: item.diff,
        }));
    }

    /**
     * Get the image for the last snapshot for each page
     * @param pageIds - The IDs of the pages to get the image for
     * @param userId - The ID of the user to get the image for
     * @returns The image for the last snapshot for each page
     */
    async getLastSnapshotImagesForPages(pageIds: string[], userId: string) {
        const snapshots = await this.getLastSnapshotsForPages(pageIds, userId);

        const imagePromises = snapshots.map(async (item) => ({
            pageId: item.pageId,
            image: await this.getSnapshotContent(item.id, 'screenshot'),
        }));

        return await Promise.all(imagePromises);
    }

    /**
     * Get the HTML for the last snapshot for each page
     * @param pageIds - The IDs of the pages to get the HTML for
     * @param userId - The ID of the user to get the HTML for
     * @returns The HTML for the last snapshot for each page
     */
    async getLastSnapshotHtmlsForPages(pageIds: string[], userId: string) {
        const snapshots = await this.getLastSnapshotsForPages(pageIds, userId);

        const htmlPromises = snapshots.map(async (item) => ({
            pageId: item.pageId,
            html: await this.getSnapshotContent(item.id, 'html'),
        }));

        return await Promise.all(htmlPromises);
    }

    /**
     * Get the diff for the last snapshot for each page
     * @param pageIds - The IDs of the pages to get the diff for
     * @param userId - The ID of the user to get the diff for
     * @returns The diff for the last snapshot for each page
     */
    async getLastSnapshotDiffsForPages(pageIds: string[], userId: string) {
        const snapshots = await this.getLastSnapshotsForPages(pageIds, userId);

        return snapshots.map((item) => ({
            pageId: item.pageId,
            diff: item.diff,
        }));
    }
}

export const snapshotRepository = SnapshotRepository.getInstance();
