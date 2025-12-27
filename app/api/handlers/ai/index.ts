import { Context } from 'hono';
import { aiService } from '@/services/ai';
import { dealQueries, contactQueries, interactionQueries, companyQueries } from '@/db/queries';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';

const generateDealInsightsSchema = z.object({
    dealId: z.string(),
});

const generateContactInsightsSchema = z.object({
    contactId: z.string(),
});

const generateCompanyInsightsSchema = z.object({
    companyId: z.string(),
});

const summarizeInteractionSchema = z.object({
    interactionId: z.string(),
});

const generateFollowUpEmailSchema = z.object({
    contactId: z.string(),
    dealId: z.string().optional(),
    purpose: z.enum(['follow_up', 'proposal', 'check_in', 'thank_you', 'meeting_request']),
    additionalContext: z.string().optional(),
});

const suggestNextActionsSchema = z.object({
    dealId: z.string(),
});

export async function handleGenerateDealInsights(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        const { dealId } = generateDealInsightsSchema.parse(body);

        // Get deal with relations
        const deal = await dealQueries.getDealById(dealId, user.id);

        // Get recent interactions for this deal
        const interactions = await interactionQueries.getEntityTimeline(user.id, 'deal', dealId, 10);

        const insights = await aiService.generateDealInsights(
            {
                name: deal.name,
                value: deal.value,
                stage: deal.stage?.name,
                probability: deal.probability,
                expectedCloseDate: deal.expectedCloseDate,
                description: deal.description,
                priority: deal.priority,
            },
            deal.company,
            deal.contact,
            interactions.map((i) => ({
                type: i.type,
                subject: i.subject,
                content: i.content,
                outcome: i.outcome,
                occurredAt: i.occurredAt,
            }))
        );

        // Update deal with AI insights
        await dealQueries.updateDeal(dealId, user.id, {
            aiSummary: insights.summary,
            aiNextSteps: insights.nextSteps.join('\n'),
            aiScore: insights.healthScore,
        });

        return c.json(insights);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Deal not found') {
            return c.json({ error: 'Deal not found' }, 404);
        }
        console.error('Error generating deal insights:', error);
        return c.json({ error: 'Failed to generate deal insights' }, 500);
    }
}

export async function handleGenerateContactInsights(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        const { contactId } = generateContactInsightsSchema.parse(body);

        // Get contact with relations
        const contact = await contactQueries.getContactById(contactId, user.id);

        // Get interactions for this contact
        const interactions = await interactionQueries.getEntityTimeline(user.id, 'contact', contactId, 20);

        const insights = await aiService.generateContactInsights(
            {
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                title: contact.title,
                notes: contact.notes,
            },
            contact.company,
            interactions.map((i) => ({
                type: i.type,
                subject: i.subject,
                content: i.content,
                outcome: i.outcome,
                direction: i.direction,
                occurredAt: i.occurredAt,
            }))
        );

        return c.json(insights);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Contact not found') {
            return c.json({ error: 'Contact not found' }, 404);
        }
        console.error('Error generating contact insights:', error);
        return c.json({ error: 'Failed to generate contact insights' }, 500);
    }
}

export async function handleGenerateCompanyInsights(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        const { companyId } = generateCompanyInsightsSchema.parse(body);

        // Get company
        const company = await companyQueries.getCompanyById(companyId, user.id);

        // Get deal stats for this company
        const dealStats = await dealQueries.getDealStats(user.id);

        // Get contact count
        const contactResult = await contactQueries.getUserContacts(user.id, { companyId, pageSize: 1 });

        const insights = await aiService.generateCompanyInsights(
            {
                name: company.name,
                url: company.url,
                description: company.description,
                industry: company.industry,
                size: company.size,
                employeeCount: company.employeeCount,
            },
            dealStats,
            contactResult.pagination.totalItems
        );

        // Update company with AI insights
        await companyQueries.updateCompany(companyId, user.id, {
            aiSummary: insights.summary,
            aiInsights: {
                strengths: insights.strengths,
                weaknesses: insights.weaknesses,
                opportunities: insights.opportunities,
                threats: insights.threats,
                recentNews: insights.recentNews,
            },
        });

        return c.json(insights);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Company not found') {
            return c.json({ error: 'Company not found' }, 404);
        }
        console.error('Error generating company insights:', error);
        return c.json({ error: 'Failed to generate company insights' }, 500);
    }
}

export async function handleSummarizeInteraction(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        const { interactionId } = summarizeInteractionSchema.parse(body);

        // Get interaction
        const interaction = await interactionQueries.getInteractionById(interactionId, user.id);

        if (!interaction.content) {
            return c.json({ error: 'Interaction has no content to summarize' }, 400);
        }

        const summary = await aiService.summarizeInteraction(
            {
                type: interaction.type,
                subject: interaction.subject,
                content: interaction.content,
                direction: interaction.direction,
            },
            {
                dealName: interaction.deal?.name,
                contactName: interaction.contact ? `${interaction.contact.firstName} ${interaction.contact.lastName || ''}`.trim() : undefined,
                companyName: interaction.company?.name,
            }
        );

        // Update interaction with AI summary
        await interactionQueries.updateInteraction(interactionId, user.id, {
            summary: summary.summary,
            aiSentiment: summary.sentiment,
            aiKeyPoints: summary.keyPoints,
            aiActionItems: summary.actionItems,
        });

        return c.json(summary);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Interaction not found') {
            return c.json({ error: 'Interaction not found' }, 404);
        }
        console.error('Error summarizing interaction:', error);
        return c.json({ error: 'Failed to summarize interaction' }, 500);
    }
}

export async function handleGenerateFollowUpEmail(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        const { contactId, dealId, purpose, additionalContext } = generateFollowUpEmailSchema.parse(body);

        // Get contact
        const contact = await contactQueries.getContactById(contactId, user.id);

        // Get last interaction with this contact
        const interactions = await interactionQueries.getEntityTimeline(user.id, 'contact', contactId, 1);
        const lastInteraction = interactions[0];

        // Get deal if provided
        let dealName: string | undefined;
        if (dealId) {
            const deal = await dealQueries.getDealById(dealId, user.id);
            dealName = deal.name;
        }

        const email = await aiService.generateFollowUpEmail({
            contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
            companyName: contact.company?.name,
            dealName,
            lastInteraction: lastInteraction
                ? {
                      type: lastInteraction.type,
                      subject: lastInteraction.subject,
                      summary: lastInteraction.summary || undefined,
                      date: lastInteraction.occurredAt,
                  }
                : undefined,
            purpose,
            additionalContext,
        });

        return c.json(email);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && (error.message === 'Contact not found' || error.message === 'Deal not found')) {
            return c.json({ error: error.message }, 404);
        }
        console.error('Error generating follow-up email:', error);
        return c.json({ error: 'Failed to generate follow-up email' }, 500);
    }
}

export async function handleSuggestNextActions(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        const { dealId } = suggestNextActionsSchema.parse(body);

        // Get deal
        const deal = await dealQueries.getDealById(dealId, user.id);

        // Get recent interactions
        const interactions = await interactionQueries.getEntityTimeline(user.id, 'deal', dealId, 5);

        // Calculate days since last activity
        const lastActivity = interactions[0];
        const daysSinceLastActivity = lastActivity
            ? Math.floor((Date.now() - lastActivity.occurredAt.getTime()) / (1000 * 60 * 60 * 24))
            : undefined;

        // Calculate days until expected close
        const daysUntilExpectedClose = deal.expectedCloseDate
            ? Math.floor((deal.expectedCloseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : undefined;

        const actions = await aiService.suggestNextActions(
            {
                name: deal.name,
                stage: deal.stage?.name,
                value: deal.value,
                daysSinceLastActivity,
                daysUntilExpectedClose,
            },
            interactions.map((i) => ({ type: i.type, outcome: i.outcome }))
        );

        return c.json({ actions });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Deal not found') {
            return c.json({ error: 'Deal not found' }, 404);
        }
        console.error('Error suggesting next actions:', error);
        return c.json({ error: 'Failed to suggest next actions' }, 500);
    }
}
