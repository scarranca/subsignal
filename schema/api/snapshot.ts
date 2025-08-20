import { z } from 'zod';
import { paginationSchema } from './common';

/**
 * Schema for creating a snapshot
 */
export const createSnapshotSchema = z.object({
    pageId: z.string().min(1, 'Page ID is required'),
    type: z.enum(['live', 'archive']).default('live'),
});

/**
 * Schema for fetching snapshots with content filter
 */
export const fetchSnapshotQuerySchema = z.object({
    content: z.enum(['html', 'screenshot', 'diff', 'all']).default('diff'),
});

/**
 * Schema for listing snapshots with pagination and content filter
 */
export const listSnapshotsQuerySchema = paginationSchema.merge(fetchSnapshotQuerySchema);

/**
 * Exported types
 */
export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
export type FetchSnapshotQuery = z.infer<typeof fetchSnapshotQuerySchema>;
export type ListSnapshotsQuery = z.infer<typeof listSnapshotsQuerySchema>;
