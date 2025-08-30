import { briefing } from '@/db/schema/briefing';
import { Frequency } from '@/db/schema/preference';

// Base briefing type from database
export type Briefing = typeof briefing.$inferSelect;

// Extended briefing types with content
export type BriefingWithContent = Briefing & {
    content?: string;
};

/**
 * The content type of a briefing
 * @default 'text'
 * @description The content type of a briefing
 * @example 'text' - The text content of the briefing
 * @example 'all' - All content including metadata
 */
export type BriefingContent = 'yaml' | 'html' | 'url' | 'all';

/**
 * The error type for a briefing
 * @description The error type for a briefing
 */
export interface BriefingError {
    briefingId: number;
    field: 'content';
    error: string;
}

/**
 * The result type for a batch operation
 * @description The result type for a batch operation
 */
export interface ResilientBatchResult<T> {
    data: T[];
    errors: BriefingError[];
    totalRequested: number;
    successfullyProcessed: number;
}

/**
 * The partial briefing type that can include partial data and error info
 * @description The partial briefing type that can include partial data and error info
 */
export interface PartialBriefing extends Briefing {
    content?: string | null;
    _contentErrors?: string[];
}

// Types for briefing content generation
export interface Change {
    text: string;
    urls?: string[];
}

export interface ChangeData {
    summary?: string;
    changes?: Change[];
}

export interface BriefingEmailProps {
    company?: string;
    period?: Frequency;
    generatedAt?: string;
    data?: Record<string, ChangeData>;
}

// Internal types for YAML processing
export interface YAMLData {
    [category: string]: string[];
}

export interface URLChanges {
    [url: string]: string[];
}
