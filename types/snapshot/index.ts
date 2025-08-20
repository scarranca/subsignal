import { snapshot } from '@/db/schema/snapshot';

// Base snapshot type from database
export type Snapshot = typeof snapshot.$inferSelect;

// Extended snapshot types with content
export type SnapshotWithHTML = Snapshot & {
    html: string;
};

export type SnapshotWithScreenshot = Snapshot & {
    screenshot: Uint8Array;
};

export type SnapshotWithContent = Snapshot & {
    html?: string;
    screenshot?: Uint8Array;
};

/**
 * The content type of a snapshot
 * @default 'diff'
 * @description The content type of a snapshot
 * @example 'html' - The HTML content of the snapshot
 * @example 'screenshot' - The screenshot content of the snapshot
 * @example 'diff' - The diff content of the snapshot
 * @example 'all' - The Diff, HTML and screenshot content of the snapshot
 */
export type SnapshotContent = 'html' | 'screenshot' | 'diff' | 'all';
