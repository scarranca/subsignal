import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGenerateDealInsights,
    handleGenerateContactInsights,
    handleGenerateCompanyInsights,
    handleSummarizeInteraction,
    handleGenerateFollowUpEmail,
    handleSuggestNextActions,
} from '@/app/api/handlers/ai';
import { requireBilling } from '@/app/api/middleware/billing';

const ai = new Hono();

// Apply auth middleware to all AI routes
ai.use('*', requireAuth);

// Apply billing middleware
ai.use('*', requireBilling);

/**
 * AI-powered CRM features
 */

// POST /api/v1/ai/deals/insights - Generate AI insights for a deal
ai.post('/deals/insights', handleGenerateDealInsights);

// POST /api/v1/ai/contacts/insights - Generate AI insights for a contact
ai.post('/contacts/insights', handleGenerateContactInsights);

// POST /api/v1/ai/companies/insights - Generate AI insights for a company
ai.post('/companies/insights', handleGenerateCompanyInsights);

// POST /api/v1/ai/interactions/summarize - Summarize an interaction
ai.post('/interactions/summarize', handleSummarizeInteraction);

// POST /api/v1/ai/email/follow-up - Generate follow-up email draft
ai.post('/email/follow-up', handleGenerateFollowUpEmail);

// POST /api/v1/ai/deals/actions - Suggest next actions for a deal
ai.post('/deals/actions', handleSuggestNextActions);

export default ai;
