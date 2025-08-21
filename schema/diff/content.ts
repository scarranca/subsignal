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
            'Array of simple strings describing pricing changes, e.g. price increases, new tiers, promotional offers. Each item should be a complete descriptive sentence, not an object.',
        systemPrompt:
            'Pricing: Changes in costs, pricing tiers, promotional offers, discounts, etc.',
    },
    product: {
        schema: z.array(z.string()),
        description:
            'Array of simple strings describing product updates, new features, removals, or modifications. Each item should be a complete descriptive sentence, not an object.',
        systemPrompt:
            'Product: Changes in features, product updates, removals, modifications, new product launches, etc.',
    },
    customer: {
        schema: z.array(z.string()),
        description:
            'Array of simple strings describing changes in customer experience, support, testimonials, or customer-facing initiatives. Each item should be a complete descriptive sentence, not an object.',
        systemPrompt:
            'Customer: Changes in customer experience, support offerings, testimonials, case studies, customer success initiatives, etc.',
    },
    partnership: {
        schema: z.array(z.string()),
        description:
            'Array of simple strings describing new partnerships, terminated partnerships, or partnership program changes. Each item should be a complete descriptive sentence, not an object.',
        systemPrompt:
            'Partnership: New partnerships, terminated partnerships, partnership program changes, integration partnerships, etc.',
    },
    branding: {
        schema: z.array(z.string()),
        description:
            'Array of simple strings describing branding changes including visual identity, logo, website design, or other brand assets. Each item should be a complete descriptive sentence, not an object.',
        systemPrompt:
            'Branding: Changes in visual identity, logos, website design, brand assets, brand positioning, etc.',
    },
    messaging: {
        schema: z.array(z.string()),
        description:
            'Array of simple strings describing changes in messaging, value propositions, marketing copy, or communication strategy. Each item should be a complete descriptive sentence, not an object.',
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
2.2.1 Write each change as a simple, complete string (not an object)
2.2.2 Start with action verbs like "Added", "Removed", "Updated", "Changed"
2.2.3 Include relevant context (numbers, timeframes, features) in the same string
2.2.4 Each change should be one descriptive sentence or phrase. Separate related but distinct changes into individual items.
2.2.5 Example format: "Added new pricing tier for enterprise customers at $500/month"
2.3 In case no relevant changes, DO NOT hallucinate or invent changes. Simply return an empty array.

# Output Format
Return each change as a simple string in the appropriate array, NOT as objects with action/detail properties.

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
