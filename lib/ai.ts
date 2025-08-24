/**
 * AI-powered utilities for extracting company names and generating titles
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { DEFAULT_SUMMARY_MODEL } from '@/constants/models';

// Simplified Zod schemas for AI structured output
const CompanyExtractionSchema = z.object({
    companyName: z
        .string()
        .describe('The proper business/company name extracted from the URL or domain'),
});

const TitleGenerationSchema = z.object({
    title: z.string().describe('A descriptive and appropriate page title'),
});

/**
 * AI-powered company name extraction from URL
 * @param url - The URL to extract company name from
 * @returns Promise<string> - The extracted company name
 */
export async function extractCompanyNameAI(url: string): Promise<string> {
    try {
        const { object } = await generateObject({
            model: openai(DEFAULT_SUMMARY_MODEL),
            schema: CompanyExtractionSchema,
            prompt: `Extract the proper company or business name from this URL: ${url}

            Consider:
            - Domain name patterns (e.g., stripe.com -> Stripe, microsoft.com -> Microsoft)
            - Subdomain contexts (e.g., docs.github.com -> GitHub)
            - Brand naming conventions
            - Common business naming patterns

            If it's a personal website or unclear, provide the best guess based on the domain.`,
        });

        return object.companyName;
    } catch (error) {
        console.error('AI company name extraction failed:', error);
        throw error;
    }
}

/**
 * AI-powered title generation from URL
 * @param url - The URL to generate title from
 * @returns Promise<string> - Generated title
 */
export async function generateTitleAI(url: string): Promise<string> {
    try {
        const { object } = await generateObject({
            model: openai(DEFAULT_SUMMARY_MODEL),
            schema: TitleGenerationSchema,
            prompt: `Generate an appropriate page title for this URL: ${url}

            Consider:
            - URL path structure and segments
            - Domain context
            - Common web page naming patterns
            - User-friendly, descriptive titles

            Examples:
            - "https://docs.stripe.com/api" -> "API Documentation"
            - "https://github.com/microsoft/vscode" -> "Visual Studio Code Repository"
            - "https://example.com/about-us" -> "About Us"
            - "https://shop.nike.com/products/air-max" -> "Air Max Products"

            Make it concise but descriptive.`,
        });

        return object.title;
    } catch (error) {
        console.error('AI title generation failed:', error);
        throw error;
    }
}
