// Define the Change type based on what diffLines actually returns
export interface Change {
    count?: number;
    added?: boolean;
    removed?: boolean;
    value: string;
}

/**
 * Result type for better error handling and metadata
 */
export interface MarkdownDiffResult {
    diff: string;
    oldMarkdown: string;
    newMarkdown: string;
    changeCount: number;
    hasChanges: boolean;
    error?: string;
}
