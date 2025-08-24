import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { DiffAnalysisOptions, PartialDiffAnalysis } from '@/types/diff/content';
import {
    createDynamicSchema,
    generateSystemPrompt,
    generateDiffAnalysisPrompt,
} from '@/schema/diff/content';
import { DEFAULT_DIFF_MODEL } from '@/constants/models';
import { ALL_DIFF_PROPERTIES } from '@/constants/preferences';

/**
 * Service for analyzing content differences
 */
export class ContentDiffService {
    private static instance: ContentDiffService;

    private constructor() {}

    public static getInstance(): ContentDiffService {
        if (!ContentDiffService.instance) {
            ContentDiffService.instance = new ContentDiffService();
        }
        return ContentDiffService.instance;
    }

    /**
     * Analyze content differences
     */
    async diff(
        markdownDiff: string,
        options: DiffAnalysisOptions = {
            properties: ALL_DIFF_PROPERTIES,
        },
    ): Promise<PartialDiffAnalysis> {
        // Default to all properties if none specified
        const properties = options.properties || ALL_DIFF_PROPERTIES;

        // Create dynamic schema and prompts
        const schema = createDynamicSchema(properties);
        const systemPrompt = generateSystemPrompt(properties);
        const userPrompt = generateDiffAnalysisPrompt(markdownDiff);

        try {
            const result = await generateObject({
                model: openai(DEFAULT_DIFF_MODEL),
                schema,
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.1, // Lower temperature for more deterministic results
                maxRetries: 2, // Use built-in retry logic
            });

            return result.object;
        } catch (error: any) {
            console.error('Content diff analysis error after retries:', error);

            // Check if it's a schema validation error and attempt recovery
            if (this.isSchemaValidationError(error)) {
                const recoveredResult = this.attemptSchemaRecovery(error, properties);
                if (recoveredResult) {
                    console.log('Successfully recovered from schema validation error');
                    return recoveredResult;
                }
            }

            // If recovery fails, return a safe fallback
            console.error('Recovery failed, returning empty result');
            return this.createEmptyResult(properties);
        }
    }

    /**
     * Check if error is a schema validation error
     */
    private isSchemaValidationError(error: any): boolean {
        return (
            error?.name === 'AI_NoObjectGeneratedError' ||
            error?.name === 'AI_TypeValidationError' ||
            error?.cause?.name === 'ZodError'
        );
    }

    /**
     * Attempt to recover from schema validation errors by transforming the response
     */
    private attemptSchemaRecovery(error: any, properties: string[]): PartialDiffAnalysis | null {
        try {
            // Try to extract the raw response from the error
            const rawValue = error?.value || error?.cause?.issues?.[0]?.value;
            if (!rawValue) return null;

            // Transform objects in arrays to strings
            const recovered: any = {};

            for (const prop of properties) {
                if (rawValue[prop] && Array.isArray(rawValue[prop])) {
                    recovered[prop] = rawValue[prop].map((item: any) => {
                        if (typeof item === 'string') {
                            return item;
                        } else if (typeof item === 'object' && item !== null) {
                            // Transform object to string
                            return Object.entries(item)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join('; ');
                        }
                        return String(item);
                    });
                } else {
                    recovered[prop] = [];
                }
            }

            return recovered as PartialDiffAnalysis;
        } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError);
            return null;
        }
    }

    /**
     * Create an empty result as a safe fallback
     */
    private createEmptyResult(properties: string[]): PartialDiffAnalysis {
        const result: any = {};
        properties.forEach((prop) => {
            result[prop] = [];
        });
        return result as PartialDiffAnalysis;
    }
}
