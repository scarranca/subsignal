import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { briefingQueries } from '@/db/queries/briefing';
import { PaginationOptions } from '@/db/queries/types';
import Sqids from 'sqids';
import {
    Briefing,
    BriefingContent,
    BriefingWithContent,
    PartialBriefing,
    BriefingError,
    ResilientBatchResult,
} from '@/types/briefing';

/**
 * BriefingRepository class for managing briefings with resilient batch operations
 * @description This class is used to manage briefings for companies
 */
export class BriefingRepository {
    private static instance: BriefingRepository;
    private s3Client: S3Client;
    private bucketName: string;
    private sqids: Sqids;

    private constructor() {
        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.BRIEFING_R2_ENDPOINT || process.env.SNAPSHOT_R2_ENDPOINT,
            credentials: {
                accessKeyId:
                    process.env.BRIEFING_R2_ACCESS_KEY_ID! ||
                    process.env.SNAPSHOT_R2_ACCESS_KEY_ID!,
                secretAccessKey:
                    process.env.BRIEFING_R2_SECRET_ACCESS_KEY! ||
                    process.env.SNAPSHOT_R2_SECRET_ACCESS_KEY!,
            },
        });
        this.bucketName =
            process.env.BRIEFING_R2_BUCKET_NAME! || process.env.SNAPSHOT_R2_BUCKET_NAME!;
        this.sqids = new Sqids({
            minLength: 10,
        });
    }

    /**
     * Get the instance of the BriefingRepository
     * @returns The instance of the BriefingRepository
     */
    public static getInstance(): BriefingRepository {
        if (!BriefingRepository.instance) {
            BriefingRepository.instance = new BriefingRepository();
        }
        return BriefingRepository.instance;
    }

    /**
     * Generate a path ID for a briefing
     * @param briefingId - The ID of the briefing to generate the path for
     * @returns The path ID for the briefing
     */
    private generatePathId(briefingId: number): string {
        return this.sqids.encode([briefingId]);
    }

    /**
     * Get the path for a briefing
     * @param briefingId - The ID of the briefing to get the path for
     * @returns The path for the briefing
     */
    private getBriefingPath(briefingId: number): string {
        const pathId = this.generatePathId(briefingId);
        return `briefing/${pathId}`;
    }

    /**
     * Upload a file to R2
     * @param key - The key of the file
     * @param content - The content of the file
     * @param contentType - The content type of the file
     */
    private async uploadToR2(key: string, content: string, contentType: string): Promise<void> {
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
    private async getBriefingContentSafe(briefingId: number): Promise<{
        content: string | null;
        error?: string;
    }> {
        try {
            const content = await this.getBriefingContent(briefingId);
            return { content };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Failed to load content for briefing ${briefingId}:`, errorMessage);
            return {
                content: null,
                error: `Failed to load content: ${errorMessage}`,
            };
        }
    }

    /**
     * Get the URL for a briefing
     * @param briefingId - The ID of the briefing to get the URL for
     * @returns The URL for the briefing
     */
    private getBriefingUrl(briefingId: number): string {
        const path = this.getBriefingPath(briefingId);
        return `${process.env.BRIEFING_BUCKET_BASE}/${path}`;
    }

    /**
     * Process a single briefing and collect any errors
     */
    private async processBriefingWithErrors(
        briefing: Briefing,
        content: BriefingContent,
    ): Promise<{
        briefing: PartialBriefing;
        errors: BriefingError[];
    }> {
        const errors: BriefingError[] = [];
        const processedBriefing: PartialBriefing = { ...briefing };

        if (content === 'html' || content === 'all') {
            const { content: briefingContent, error } = await this.getBriefingContentSafe(
                briefing.id,
            );
            processedBriefing.content = briefingContent;
            if (error) {
                errors.push({
                    briefingId: briefing.id,
                    field: 'content',
                    error,
                });
            }
        } else if (content === 'url') {
            const url = this.getBriefingUrl(briefing.id);
            processedBriefing.content = url;
        }

        // Add content errors summary to the briefing for easy access
        if (errors.length > 0) {
            processedBriefing._contentErrors = errors.map((e) => e.error);
        }

        return { briefing: processedBriefing, errors };
    }

    /**
     * Create a briefing for a company
     * @param companyId - The ID of the company to create the briefing for
     * @param companyUrl - The URL of the company to create the briefing for
     * @param briefingText - The text content stored in database
     * @param briefingContent - The full content to store in R2 (optional, defaults to briefingText)
     * @returns The created briefing
     */
    async createBriefingForCompany(
        companyId: string,
        companyUrl: string,
        briefingText: string,
        briefingContent?: string,
    ) {
        const briefing = await briefingQueries.createBriefing(companyId, companyUrl, briefingText);

        try {
            const path = this.getBriefingPath(briefing.id);

            // Upload full content to R2 if provided, otherwise use the briefing text
            const contentToStore = briefingContent || briefingText;
            await this.uploadToR2(path, contentToStore, 'text/plain');

            return briefing;
        } catch (error) {
            console.error('Failed to upload briefing to R2:', error);
            throw new Error('Failed to store briefing content');
        }
    }

    /**
     * Get the last briefing for a company
     * @param companyId - The ID of the company to get the last briefing for
     * @param content - The content to retrieve
     * @returns The last briefing for the company
     */
    async getLastBriefingForCompany(
        companyId: string,
        content: BriefingContent = 'all',
    ): Promise<BriefingWithContent | Briefing | null> {
        const briefing = await briefingQueries.getLastBriefingForCompany(companyId);

        if (!briefing) {
            return null;
        }

        if (content === 'html' || content === 'all') {
            return {
                ...briefing,
                content: await this.getBriefingContent(briefing.id),
            };
        }

        return briefing;
    }

    /**
     * List briefings with resilient error handling
     * @param content - The content to get for the briefings
     * @param options - The options for the pagination
     * @returns The briefings with error information
     */
    async listBriefings(
        companyIds: string[],
        content: BriefingContent = 'url',
        options: PaginationOptions = {},
    ): Promise<{ data: PartialBriefing[]; errors: BriefingError[] }> {
        const results = await briefingQueries.getBriefings(companyIds, options);

        // Process all briefings and collect errors
        const processResults = await Promise.allSettled(
            results.data.map((briefing) => this.processBriefingWithErrors(briefing, content)),
        );

        const processedBriefings: PartialBriefing[] = [];
        const allErrors: BriefingError[] = [];

        processResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                processedBriefings.push(result.value.briefing);
                allErrors.push(...result.value.errors);
            } else {
                // Even if processing completely fails, include the basic briefing data
                const originalBriefing = results.data[index];
                processedBriefings.push({
                    ...originalBriefing,
                    _contentErrors: [
                        `Complete processing failure: ${result.reason?.message || 'Unknown error'}`,
                    ],
                });
                allErrors.push({
                    briefingId: originalBriefing.id,
                    field: 'content',
                    error: `Processing failed: ${result.reason?.message || 'Unknown error'}`,
                });
            }
        });

        return {
            data: processedBriefings,
            errors: allErrors,
        };
    }

    /**
     * Get paginated briefings for a company with resilient error handling
     * @param companyId - The ID of the company to get briefings for
     * @param content - The content to get for the briefings
     * @param options - The options for the pagination
     * @returns The briefings for the company with error information
     */
    async getPaginatedBriefingsForCompany(
        companyId: string,
        content: BriefingContent = 'all',
        options: PaginationOptions = {},
    ): Promise<
        ResilientBatchResult<PartialBriefing> & {
            total: number;
            hasMore: boolean;
        }
    > {
        const results = await briefingQueries.getPaginatedBriefingsForCompany(companyId, options);

        // If only basic data is requested, no S3 operations needed
        if (content !== 'html' && content !== 'all') {
            return {
                data: results.data,
                errors: [],
                totalRequested: results.data.length,
                successfullyProcessed: results.data.length,
                total: results.pagination.totalItems,
                hasMore: results.pagination.hasNext,
            };
        }

        // Process all briefings and collect errors
        const processResults = await Promise.allSettled(
            results.data.map((briefing) => this.processBriefingWithErrors(briefing, content)),
        );

        const processedBriefings: PartialBriefing[] = [];
        const allErrors: BriefingError[] = [];

        processResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                processedBriefings.push(result.value.briefing);
                allErrors.push(...result.value.errors);
            } else {
                const originalBriefing = results.data[index];
                processedBriefings.push({
                    ...originalBriefing,
                    _contentErrors: [
                        `Complete processing failure: ${result.reason?.message || 'Unknown error'}`,
                    ],
                });
                allErrors.push({
                    briefingId: originalBriefing.id,
                    field: 'content',
                    error: `Processing failed: ${result.reason?.message || 'Unknown error'}`,
                });
            }
        });

        return {
            data: processedBriefings,
            errors: allErrors,
            totalRequested: results.data.length,
            successfullyProcessed: processedBriefings.filter((b) => !b._contentErrors).length,
            total: results.pagination.totalItems,
            hasMore: results.pagination.hasNext,
        };
    }

    /**
     * Get paginated briefings for a user (across all their companies) with resilient error handling
     * @param userId - The ID of the user to get briefings for
     * @param content - The content to get for the briefings
     * @param options - The options for the pagination
     * @returns The briefings for the user with error information
     */
    async getPaginatedBriefingsForUser(
        userId: string,
        content: BriefingContent = 'all',
        options: PaginationOptions = {},
    ): Promise<
        ResilientBatchResult<PartialBriefing & { companyName: string }> & {
            total: number;
            hasMore: boolean;
        }
    > {
        const results = await briefingQueries.getPaginatedBriefingsForUser(userId, options);

        // If only basic data is requested, no S3 operations needed
        if (content !== 'html' && content !== 'all') {
            return {
                data: results.data,
                errors: [],
                totalRequested: results.data.length,
                successfullyProcessed: results.data.length,
                total: results.pagination.totalItems,
                hasMore: results.pagination.hasNext,
            };
        }

        // Process all briefings and collect errors
        const processResults = await Promise.allSettled(
            results.data.map(async (briefingWithCompany) => {
                const { companyName, ...briefing } = briefingWithCompany;
                const processResult = await this.processBriefingWithErrors(briefing, content);
                return {
                    briefing: { ...processResult.briefing, companyName },
                    errors: processResult.errors,
                };
            }),
        );

        const processedBriefings: (PartialBriefing & { companyName: string })[] = [];
        const allErrors: BriefingError[] = [];

        processResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                processedBriefings.push(result.value.briefing);
                allErrors.push(...result.value.errors);
            } else {
                const originalBriefing = results.data[index];
                processedBriefings.push({
                    ...originalBriefing,
                    _contentErrors: [
                        `Complete processing failure: ${result.reason?.message || 'Unknown error'}`,
                    ],
                });
                allErrors.push({
                    briefingId: originalBriefing.id,
                    field: 'content',
                    error: `Processing failed: ${result.reason?.message || 'Unknown error'}`,
                });
            }
        });

        return {
            data: processedBriefings,
            errors: allErrors,
            totalRequested: results.data.length,
            successfullyProcessed: processedBriefings.filter((b) => !b._contentErrors).length,
            total: results.pagination.totalItems,
            hasMore: results.pagination.hasNext,
        };
    }

    /**
     * Get briefing by ID with content
     * @param briefingId - The ID of the briefing to get
     * @param content - The content to retrieve
     * @returns The briefing with content
     */
    async getBriefingById(
        briefingId: number,
        content: BriefingContent = 'all',
    ): Promise<BriefingWithContent | Briefing> {
        const briefing = await briefingQueries.getBriefingById(briefingId);

        if (content === 'html' || content === 'all') {
            return {
                ...briefing,
                content: await this.getBriefingContent(briefing.id),
            };
        }

        return briefing;
    }

    /**
     * Get the content of a briefing from R2
     * @param briefingId - The ID of the briefing to get the content for
     * @returns The content of the briefing
     */
    private async getBriefingContent(briefingId: number): Promise<string> {
        const path = this.getBriefingPath(briefingId);

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: path,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new Error('No content found for briefing');
            }

            return await response.Body.transformToString();
        } catch (error) {
            if (error instanceof Error) {
                console.error('Failed to get briefing content:', error.message);
                throw error;
            }
            console.error('Failed to get briefing content:', error);
            throw new Error('Failed to retrieve briefing content');
        }
    }

    /**
     * Delete a briefing and its content from R2
     * @param briefingId - The ID of the briefing to delete
     * @returns Promise that resolves when deletion is complete
     */
    async deleteBriefing(briefingId: number): Promise<void> {
        const path = this.getBriefingPath(briefingId);

        try {
            // Delete from R2 first
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: path,
            });

            await this.s3Client.send(deleteCommand);

            // Note: Database deletion would need to be implemented in briefingQueries
            // await briefingQueries.deleteBriefing(briefingId);
        } catch (error) {
            console.error('Failed to delete briefing:', error);
            throw new Error('Failed to delete briefing');
        }
    }
}

export const briefingRepository = BriefingRepository.getInstance();
