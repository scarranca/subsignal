import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// AI model configuration
const INSIGHT_MODEL = 'gpt-4o-mini';

// Schema definitions for AI outputs
const DealInsightSchema = z.object({
    summary: z.string().describe('A 2-3 sentence summary of the deal status and key factors'),
    healthScore: z.number().min(0).max(100).describe('Overall deal health score from 0-100'),
    strengths: z.array(z.string()).describe('Key strengths or positive indicators for this deal'),
    risks: z.array(z.string()).describe('Potential risks or concerns for this deal'),
    nextSteps: z.array(z.string()).describe('Recommended next actions to move the deal forward'),
    suggestedFollowUpDate: z.string().optional().describe('Suggested date for next follow-up in ISO format'),
});

const ContactInsightSchema = z.object({
    summary: z.string().describe('A brief summary of the contact relationship'),
    engagementLevel: z.enum(['high', 'medium', 'low']).describe('Level of engagement with this contact'),
    communicationStyle: z.string().optional().describe('Observed communication preferences'),
    keyTopics: z.array(z.string()).describe('Key topics or interests discussed with this contact'),
    suggestedActions: z.array(z.string()).describe('Recommended actions to strengthen the relationship'),
});

const CompanyInsightSchema = z.object({
    summary: z.string().describe('Executive summary of the company'),
    strengths: z.array(z.string()).describe('Company strengths and opportunities'),
    weaknesses: z.array(z.string()).describe('Potential weaknesses or challenges'),
    opportunities: z.array(z.string()).describe('Market opportunities'),
    threats: z.array(z.string()).describe('Competitive threats or risks'),
    recentNews: z.array(z.string()).optional().describe('Recent notable developments'),
});

const InteractionSummarySchema = z.object({
    summary: z.string().describe('Brief summary of the interaction'),
    sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Overall sentiment of the interaction'),
    keyPoints: z.array(z.string()).describe('Key discussion points'),
    actionItems: z.array(z.string()).describe('Action items or follow-ups identified'),
    nextSteps: z.string().optional().describe('Suggested next step'),
});

export type DealInsight = z.infer<typeof DealInsightSchema>;
export type ContactInsight = z.infer<typeof ContactInsightSchema>;
export type CompanyInsight = z.infer<typeof CompanyInsightSchema>;
export type InteractionSummary = z.infer<typeof InteractionSummarySchema>;

export class AIService {
    private static instance: AIService;
    private model = openai(INSIGHT_MODEL);

    private constructor() {}

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Generate insights for a deal based on its data and interactions
     */
    async generateDealInsights(
        deal: {
            name: string;
            value?: string | null;
            stage?: string;
            probability?: number | null;
            expectedCloseDate?: Date | null;
            description?: string | null;
            priority?: string;
        },
        company?: { name: string; industry?: string | null } | null,
        contact?: { firstName: string; lastName?: string | null; title?: string | null } | null,
        recentInteractions?: Array<{
            type: string;
            subject?: string | null;
            content?: string | null;
            outcome?: string | null;
            occurredAt: Date;
        }>
    ): Promise<DealInsight> {
        const interactionsSummary = recentInteractions
            ?.map((i) => `- ${i.type}: ${i.subject || 'No subject'} (${i.outcome || 'No outcome'}) - ${i.occurredAt.toLocaleDateString()}`)
            .join('\n') || 'No recent interactions';

        const prompt = `You are a sales intelligence analyst. Analyze this deal and provide actionable insights.

DEAL INFORMATION:
- Name: ${deal.name}
- Value: ${deal.value ? `$${deal.value}` : 'Not specified'}
- Stage: ${deal.stage || 'Unknown'}
- Probability: ${deal.probability ? `${deal.probability}%` : 'Not set'}
- Expected Close: ${deal.expectedCloseDate ? deal.expectedCloseDate.toLocaleDateString() : 'Not set'}
- Priority: ${deal.priority || 'Medium'}
- Description: ${deal.description || 'No description'}

COMPANY: ${company ? `${company.name}${company.industry ? ` (${company.industry})` : ''}` : 'Not specified'}

MAIN CONTACT: ${contact ? `${contact.firstName} ${contact.lastName || ''}${contact.title ? `, ${contact.title}` : ''}` : 'Not specified'}

RECENT INTERACTIONS:
${interactionsSummary}

Provide a comprehensive analysis with:
1. A clear summary of the deal status
2. A health score (0-100) based on all factors
3. Key strengths that could help close the deal
4. Risks or red flags to watch out for
5. Specific next steps to move the deal forward
6. A suggested follow-up date if appropriate

Be direct, actionable, and focus on what matters for closing this deal.`;

        const result = await generateObject({
            model: this.model,
            schema: DealInsightSchema,
            prompt,
        });

        return result.object;
    }

    /**
     * Generate insights for a contact based on interactions
     */
    async generateContactInsights(
        contact: {
            firstName: string;
            lastName?: string | null;
            email?: string | null;
            title?: string | null;
            notes?: string | null;
        },
        company?: { name: string } | null,
        interactions?: Array<{
            type: string;
            subject?: string | null;
            content?: string | null;
            outcome?: string | null;
            direction?: string | null;
            occurredAt: Date;
        }>
    ): Promise<ContactInsight> {
        const interactionsSummary = interactions
            ?.map((i) => `- ${i.type} (${i.direction || 'unknown'}): ${i.subject || 'No subject'} - ${i.outcome || 'No outcome'} - ${i.occurredAt.toLocaleDateString()}`)
            .join('\n') || 'No interactions recorded';

        const prompt = `You are a relationship intelligence analyst. Analyze this contact's interaction history and provide insights.

CONTACT:
- Name: ${contact.firstName} ${contact.lastName || ''}
- Title: ${contact.title || 'Unknown'}
- Email: ${contact.email || 'Unknown'}
- Company: ${company?.name || 'Unknown'}
- Notes: ${contact.notes || 'None'}

INTERACTION HISTORY:
${interactionsSummary}

Provide insights on:
1. A brief summary of the relationship status
2. Their engagement level (high/medium/low)
3. Any observed communication style preferences
4. Key topics they're interested in
5. Suggested actions to strengthen the relationship

Be practical and actionable.`;

        const result = await generateObject({
            model: this.model,
            schema: ContactInsightSchema,
            prompt,
        });

        return result.object;
    }

    /**
     * Generate SWOT analysis and insights for a company
     */
    async generateCompanyInsights(
        company: {
            name: string;
            url?: string | null;
            description?: string | null;
            industry?: string | null;
            size?: string | null;
            employeeCount?: number | null;
        },
        dealsSummary?: {
            total: number;
            won: number;
            lost: number;
            totalValue: number;
        },
        contactsCount?: number
    ): Promise<CompanyInsight> {
        const prompt = `You are a business intelligence analyst. Analyze this company and provide strategic insights.

COMPANY INFORMATION:
- Name: ${company.name}
- Website: ${company.url || 'Unknown'}
- Industry: ${company.industry || 'Unknown'}
- Size: ${company.size || 'Unknown'}
- Employees: ${company.employeeCount || 'Unknown'}
- Description: ${company.description || 'No description available'}

RELATIONSHIP DATA:
- Total Deals: ${dealsSummary?.total || 0}
- Won Deals: ${dealsSummary?.won || 0}
- Lost Deals: ${dealsSummary?.lost || 0}
- Total Deal Value: $${dealsSummary?.totalValue || 0}
- Contacts: ${contactsCount || 0}

Provide a strategic analysis including:
1. An executive summary of the company
2. Key strengths and competitive advantages
3. Potential weaknesses or challenges
4. Market opportunities
5. Competitive threats or risks

Focus on actionable intelligence that would help in sales and relationship management.`;

        const result = await generateObject({
            model: this.model,
            schema: CompanyInsightSchema,
            prompt,
        });

        return result.object;
    }

    /**
     * Summarize an interaction and extract key information
     */
    async summarizeInteraction(
        interaction: {
            type: string;
            subject?: string | null;
            content: string;
            direction?: string | null;
        },
        context?: {
            dealName?: string;
            contactName?: string;
            companyName?: string;
        }
    ): Promise<InteractionSummary> {
        const contextStr = context
            ? `Context: ${[context.dealName && `Deal: ${context.dealName}`, context.contactName && `Contact: ${context.contactName}`, context.companyName && `Company: ${context.companyName}`].filter(Boolean).join(', ')}`
            : '';

        const prompt = `You are an assistant that summarizes business interactions.

INTERACTION:
- Type: ${interaction.type}
- Direction: ${interaction.direction || 'Unknown'}
- Subject: ${interaction.subject || 'No subject'}
${contextStr}

CONTENT:
${interaction.content}

Provide:
1. A brief 1-2 sentence summary
2. The overall sentiment (positive/neutral/negative)
3. Key discussion points (bullet points)
4. Any action items or follow-ups mentioned
5. A suggested next step if applicable

Be concise and focus on what's actionable.`;

        const result = await generateObject({
            model: this.model,
            schema: InteractionSummarySchema,
            prompt,
        });

        return result.object;
    }

    /**
     * Generate email draft for follow-up
     */
    async generateFollowUpEmail(
        context: {
            contactName: string;
            companyName?: string;
            dealName?: string;
            lastInteraction?: {
                type: string;
                subject?: string | null;
                summary?: string;
                date: Date;
            };
            purpose: 'follow_up' | 'proposal' | 'check_in' | 'thank_you' | 'meeting_request';
            additionalContext?: string;
        }
    ): Promise<{ subject: string; body: string }> {
        const prompt = `Write a professional email for ${context.purpose.replace('_', ' ')} to ${context.contactName}${context.companyName ? ` at ${context.companyName}` : ''}.

${context.dealName ? `Deal: ${context.dealName}` : ''}
${context.lastInteraction ? `Last interaction: ${context.lastInteraction.type} on ${context.lastInteraction.date.toLocaleDateString()} - ${context.lastInteraction.summary || context.lastInteraction.subject || 'No details'}` : ''}
${context.additionalContext ? `Additional context: ${context.additionalContext}` : ''}

Write a concise, professional email with:
1. A clear subject line
2. A brief, friendly opening
3. The main purpose clearly stated
4. A specific call to action
5. Professional closing

Keep it under 150 words. Be warm but professional.`;

        const result = await generateText({
            model: this.model,
            prompt,
        });

        // Parse the response to extract subject and body
        const lines = result.text.split('\n').filter((l) => l.trim());
        const subjectLine = lines.find((l) => l.toLowerCase().startsWith('subject:'));
        const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '').trim() : 'Follow-up';

        const bodyStartIndex = lines.findIndex((l) => l.toLowerCase().startsWith('subject:')) + 1;
        const body = lines.slice(bodyStartIndex).join('\n').trim();

        return { subject, body };
    }

    /**
     * Suggest next best actions based on deal and activity data
     */
    async suggestNextActions(
        deal: {
            name: string;
            stage?: string;
            value?: string | null;
            daysSinceLastActivity?: number;
            daysUntilExpectedClose?: number;
        },
        recentActivities?: Array<{ type: string; outcome?: string | null }>
    ): Promise<string[]> {
        const activitiesSummary = recentActivities
            ?.map((a) => `${a.type}: ${a.outcome || 'No outcome'}`)
            .join(', ') || 'No recent activities';

        const prompt = `Based on this deal, suggest 3-5 specific next actions:

Deal: ${deal.name}
Stage: ${deal.stage || 'Unknown'}
Value: ${deal.value ? `$${deal.value}` : 'Not specified'}
Days since last activity: ${deal.daysSinceLastActivity ?? 'Unknown'}
Days until expected close: ${deal.daysUntilExpectedClose ?? 'Unknown'}
Recent activities: ${activitiesSummary}

Provide specific, actionable recommendations. Return only the actions as a numbered list.`;

        const result = await generateText({
            model: this.model,
            prompt,
        });

        // Parse numbered list
        const actions = result.text
            .split('\n')
            .filter((line) => /^\d+[\.\)]/.test(line.trim()))
            .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter((action) => action.length > 0);

        return actions.length > 0 ? actions : ['Schedule a follow-up call', 'Send a check-in email', 'Review deal details'];
    }
}

export const aiService = AIService.getInstance();
