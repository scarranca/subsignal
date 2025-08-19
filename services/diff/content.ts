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
                temperature: 1,
            });

            return result.object;
        } catch (error) {
            console.error('Content diff analysis error:', error);
            throw error;
        }
    }
}
