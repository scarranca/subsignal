import { z } from 'zod';
import type { DiffProperty } from '@/types/diff/content';

export interface PropertyDefinition {
    schema: z.ZodArray<z.ZodString>;
    description: string;
    systemPrompt: string;
}

// Property definitions matching preference table enum
export const propertyDefinitions: Record<DiffProperty, PropertyDefinition> = {
    pricing: {
        schema: z.array(z.string()),
        description:
            'List of detected pricing changes, e.g. price increases, new tiers, promotional offers, etc.',
        systemPrompt:
            'Pricing: Changes in costs, pricing tiers, promotional offers, discounts, etc.',
    },
    product: {
        schema: z.array(z.string()),
        description: 'List of product updates, new features, removals, or modifications, etc.',
        systemPrompt:
            'Product: Changes in features, product updates, removals, modifications, new product launches, etc.',
    },
    customer: {
        schema: z.array(z.string()),
        description:
            'List of changes in customer experience, support, testimonials, or customer-facing initiatives, etc.',
        systemPrompt:
            'Customer: Changes in customer experience, support offerings, testimonials, case studies, customer success initiatives, etc.',
    },
    partnership: {
        schema: z.array(z.string()),
        description:
            'List of new partnerships, terminated partnerships, or partnership program changes, etc.',
        systemPrompt:
            'Partnership: New partnerships, terminated partnerships, partnership program changes, integration partnerships, etc.',
    },
    branding: {
        schema: z.array(z.string()),
        description:
            'List of branding changes including visual identity, logo, website design, or other brand assets, etc.',
        systemPrompt:
            'Branding: Changes in visual identity, logos, website design, brand assets, brand positioning, etc.',
    },
    messaging: {
        schema: z.array(z.string()),
        description:
            'List of changes in messaging, value propositions, marketing copy, or communication strategy, etc.',
        systemPrompt:
            'Messaging: Changes in marketing messaging, value propositions, taglines, communication strategy, positioning statements, etc.',
    },
} as const;

// Function to create dynamic schema based on selected properties
export const createDynamicSchema = (properties: DiffProperty[]) => {
    const schemaObject: Record<string, any> = {};

    properties.forEach((property) => {
        const definition = propertyDefinitions[property];
        schemaObject[property] = definition.schema.describe(definition.description);
    });

    return z.object(schemaObject);
};

/**
 * Generates the system prompt for content diff analysis
 */
export const generateSystemPrompt = (properties: DiffProperty[]): string => {
    const selectedPrompts = properties.map(
        (prop, index) => `1.${index + 1} ${propertyDefinitions[prop].systemPrompt}`,
    );

    return `
Analyze the content for changes across the specified categories: ${properties.join(', ')}.

# Process
1. Review content for changes in:
${selectedPrompts.join('\n')}
2. For each change identified:
2.1 Document the specific change with clear description
2.2 For changes found:
2.2.1 Start with action verbs or clear transition phrases
2.2.2 List each change as a complete, detailed statement
2.2.3 Include relevant context (numbers, timeframes, features)
2.2.4 Separate related but distinct changes into individual items
2.2.5 Structure complex changes into bullet points when needed
2.3 In case no significant changes, DO NOT hallucinate or invent changes

Focus only on the requested categories: ${properties.join(', ')}.`;
};

/**
 * Generates the user prompt for analyzing a pre-generated diff
 */
export const generateDiffAnalysisPrompt = (markdownDiff: string): string => {
    return `
Carefully analyze the markdown diff and surface the changes:
[CONTENT START]
${markdownDiff}
[CONTENT END]
Focus on business-relevant changes that would be important for company monitoring and competitive analysis. Ignore minor formatting, whitespace, or technical changes that don't affect the business content.`;
};
