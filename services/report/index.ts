import { ChangeData, BriefingEmailProps, YAMLData, URLChanges } from '@/types/briefing';
import { CategorySummarySchema, CategorySummary } from '@/schema/api/briefing';
import { render } from '@react-email/render';
import { BriefingEmail } from '../../emails/briefing';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import * as yaml from 'js-yaml';
import { DEFAULT_SUMMARY_MODEL } from '@/constants/models';
import { Frequency } from '@/db/schema/preference';

export class ReportService {
    private static instance: ReportService;
    private model = openai(DEFAULT_SUMMARY_MODEL);

    private constructor() {}

    public static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService();
        }
        return ReportService.instance;
    }

    /**
     * Generate a structured briefing report from YAML inputs
     * @param yamlInputs - Record of URL to YAML content mappings
     * @param companyName - Name of the company
     * @param frequency - Frequency of the briefing
     * @returns Generated briefing email props
     */
    async generateBriefing(
        yamlInputs: Record<string, string>,
        companyName: string,
        frequency: Frequency,
    ): Promise<BriefingEmailProps> {
        // Handle case when no meaningful changes - return empty structure
        if (Object.keys(yamlInputs).length === 0) {
            return this.generateEmptyBriefing(companyName, frequency);
        }

        try {
            // Step 1: Convert YAMLs to JSON format
            const categoryData = this.convertYamlsToJsonByCategory(yamlInputs);

            console.log('categoryData', JSON.stringify(categoryData, null, 2));

            // Step 2: Process each category through OpenAI
            const categorySummaries = await this.processCategoriesWithAI(categoryData);

            console.log('categorySummaries', JSON.stringify(categorySummaries, null, 2));

            // Step 3: Transform category summaries into briefing format
            const briefingData = this.transformCategoriesToBriefing(
                categorySummaries,
                companyName,
                frequency,
            );

            console.log('briefingData', JSON.stringify(briefingData, null, 2));

            return briefingData;
        } catch (error) {
            console.error('Error generating briefing:', error);
            return this.generateEmptyBriefing(companyName, frequency);
        }
    }

    /**
     * Generate empty briefing structure for no-data scenarios
     * Let BriefingEmail template handle all fallback UI logic
     * @param company - Company name for the briefing
     * @param period - Time period for the briefing
     * @returns Empty briefing structure
     */
    generateEmptyBriefing(company: string, period: Frequency): BriefingEmailProps {
        return {
            company,
            period,
            generatedAt: new Date().toISOString(),
            data: {}, // Let BriefingEmail template handle empty data fallback
        };
    }

    /**
     * Renders briefing content as HTML using the email template
     * @param data - The briefing data to render
     * @param company - Company name for the briefing
     * @param period - Time period for the briefing
     * @param generatedAt - When the briefing was generated
     * @returns HTML string of the rendered briefing email
     */
    async renderBriefingAsHtml(
        data: Record<string, ChangeData>,
        company: string = 'Company',
        period: Frequency = '7_day',
        generatedAt: string = new Date().toISOString(),
    ): Promise<string> {
        const briefingProps: BriefingEmailProps = {
            company,
            period,
            generatedAt,
            data,
        };

        try {
            const html = await render(BriefingEmail(briefingProps));
            return html;
        } catch (error) {
            console.error('Error rendering briefing email:', error);
            throw new Error(
                `Failed to render briefing email: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Converts YAML inputs to JSON grouped by category
     */
    private convertYamlsToJsonByCategory(
        yamlInputs: Record<string, string>,
    ): Record<string, URLChanges> {
        const categoryData: Record<string, URLChanges> = {};

        // Process each YAML file
        for (const [url, yamlContent] of Object.entries(yamlInputs)) {
            try {
                const parsedYaml = yaml.load(yamlContent) as YAMLData;

                if (!parsedYaml || typeof parsedYaml !== 'object') {
                    console.warn(`Invalid YAML structure for URL: ${url}`);
                    continue;
                }

                // Group changes by category
                for (const [category, changes] of Object.entries(parsedYaml)) {
                    if (!Array.isArray(changes) || changes.length === 0) {
                        continue; // Skip empty categories like partnership: []
                    }

                    if (!categoryData[category]) {
                        categoryData[category] = {};
                    }

                    categoryData[category][url] = changes;
                }
            } catch (error) {
                console.error(`Error parsing YAML for URL ${url}:`, error);
            }
        }

        return categoryData;
    }

    /**
     * Processes each category through OpenAI to generate summaries
     */
    private async processCategoriesWithAI(
        categoryData: Record<string, URLChanges>,
    ): Promise<CategorySummary[]> {
        const categorySummaries: CategorySummary[] = [];

        // Process each category
        for (const [category, urlChanges] of Object.entries(categoryData)) {
            try {
                const summary = await this.generateCategorySummary(category, urlChanges);
                categorySummaries.push(summary);
            } catch (error) {
                console.error(`Error processing category ${category}:`, error);
                // Continue with other categories even if one fails
            }
        }

        return categorySummaries;
    }

    /**
     * Generates summary for a single category using OpenAI
     */
    private async generateCategorySummary(
        category: string,
        urlChanges: URLChanges,
    ): Promise<CategorySummary> {
        const prompt = this.buildCategorySummaryPrompt(category, urlChanges);

        const result = await generateObject({
            model: this.model,
            schema: CategorySummarySchema,
            prompt: prompt,
        });

        return result.object;
    }

    /**
     * Builds the prompt for category summary generation
     */
    private buildCategorySummaryPrompt(category: string, urlChanges: URLChanges): string {
        const changesText = Object.entries(urlChanges)
            .map(
                ([url, changes]) =>
                    `URL: ${url}\nChanges:\n${changes.map((change) => `- ${change}`).join('\n')}\n`,
            )
            .join('\n');

        return `You're a Morning Brew copywriter analyzing competitor moves.

VOICE: Sharp advisor who distills competitor moves into one-liners
STYLE: Think Peter Thiel meets Palmer Luckey - insightful with personality
TONE: Human. Conversational. Simple words. Zero jargon. Zero corporate speak.

Analyze the following changes in "${category}" and create punchy summaries that executives actually want to read.

WHAT TO DO:
1. Write a category summary that hits the main theme in 2-3 sentences max
2. Group related changes from different URLs into single insights
3. Each change gets one crisp sentence that explains what happened and why it matters
4. Skip the fluff. Get to the point. Focus on actionable intelligence.
5. Think like you're texting a friend about what these competitors just pulled

CATEGORY: ${category}

CHANGES DATA:
${changesText}

Deliver insights that are both professional and accessible.
Make it readable. Make it useful. Make it human. Do not over word it.`;
    }

    /**
     * Transform category summaries into briefing email format
     * Simple data transformation without additional AI processing
     */
    private transformCategoriesToBriefing(
        categorySummaries: CategorySummary[],
        companyName: string,
        frequency: Frequency,
    ): BriefingEmailProps {
        // Transform array of category summaries into record keyed by category name
        const data: Record<string, ChangeData> = {};

        for (const categoryData of categorySummaries) {
            data[categoryData.category] = {
                summary: categoryData.summary,
                changes: categoryData.changes,
            };
        }

        return {
            company: companyName,
            period: frequency,
            generatedAt: new Date().toISOString(),
            data,
        };
    }
}

export const reportService = ReportService.getInstance();
