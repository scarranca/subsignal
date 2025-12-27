import { Context } from 'hono';
import { interactionQueries, activityQueries } from '@/db/queries';
import { createInteractionSchema, updateInteractionSchema, interactionFilterSchema, paginationSchema } from '@/schema/api';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';

export async function handleGetInteractions(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const pagination = paginationSchema.parse(query);
        const filters = interactionFilterSchema.parse(query);

        const result = await interactionQueries.getUserInteractions(user.id, {
            ...pagination,
            ...filters,
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching interactions:', error);
        return c.json({ error: 'Failed to fetch interactions' }, 500);
    }
}

export async function handleGetInteraction(c: Context) {
    try {
        const user = getUser(c);
        const interactionId = c.req.param('id');

        if (!interactionId) {
            return c.json({ error: 'Interaction ID is required' }, 400);
        }

        const result = await interactionQueries.getInteractionById(interactionId, user.id);
        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Interaction not found') {
            return c.json({ error: 'Interaction not found' }, 404);
        }
        console.error('Error fetching interaction:', error);
        return c.json({ error: 'Failed to fetch interaction' }, 500);
    }
}

export async function handleGetEntityTimeline(c: Context) {
    try {
        const user = getUser(c);
        const entityType = c.req.param('entityType') as 'company' | 'contact' | 'deal';
        const entityId = c.req.param('entityId');
        const limit = parseInt(c.req.query('limit') || '50', 10);

        if (!entityType || !entityId) {
            return c.json({ error: 'Entity type and ID are required' }, 400);
        }

        if (!['company', 'contact', 'deal'].includes(entityType)) {
            return c.json({ error: 'Invalid entity type' }, 400);
        }

        const result = await interactionQueries.getEntityTimeline(user.id, entityType, entityId, limit);
        return c.json({ data: result });
    } catch (error) {
        console.error('Error fetching timeline:', error);
        return c.json({ error: 'Failed to fetch timeline' }, 500);
    }
}

export async function handleCreateInteraction(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createInteractionSchema.parse(body);

        const interaction = await interactionQueries.createInteraction(user.id, {
            type: validatedData.type,
            direction: validatedData.direction || null,
            outcome: validatedData.outcome || null,
            subject: validatedData.subject || null,
            content: validatedData.content || null,
            companyId: validatedData.companyId || null,
            contactId: validatedData.contactId || null,
            dealId: validatedData.dealId || null,
            scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
            occurredAt: validatedData.occurredAt ? new Date(validatedData.occurredAt) : new Date(),
            duration: validatedData.duration ?? null,
        });

        // Determine activity action based on interaction type
        const activityAction = validatedData.type === 'call'
            ? (validatedData.direction === 'outbound' ? 'call_made' : 'call_received')
            : validatedData.type === 'email'
                ? (validatedData.direction === 'outbound' ? 'email_sent' : 'email_received')
                : validatedData.type === 'meeting'
                    ? 'meeting_completed'
                    : 'created';

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'interaction',
            entityId: interaction.id,
            entityName: validatedData.subject || `${validatedData.type} interaction`,
            action: activityAction,
            description: `Logged ${validatedData.type}: ${validatedData.subject || 'No subject'}`,
            relatedCompanyId: interaction.companyId || undefined,
            relatedContactId: interaction.contactId || undefined,
            relatedDealId: interaction.dealId || undefined,
        });

        return c.json(interaction, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error creating interaction:', error);
        return c.json({ error: 'Failed to create interaction' }, 500);
    }
}

export async function handleUpdateInteraction(c: Context) {
    try {
        const user = getUser(c);
        const interactionId = c.req.param('id');
        const body = await c.req.json();

        if (!interactionId) {
            return c.json({ error: 'Interaction ID is required' }, 400);
        }

        const validatedData = updateInteractionSchema.parse(body);

        // Convert dates if present
        const updateData: any = { ...validatedData };
        if (validatedData.scheduledAt) {
            updateData.scheduledAt = new Date(validatedData.scheduledAt);
        }
        if (validatedData.occurredAt) {
            updateData.occurredAt = new Date(validatedData.occurredAt);
        }

        const updatedInteraction = await interactionQueries.updateInteraction(interactionId, user.id, updateData);

        return c.json(updatedInteraction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Interaction not found') {
            return c.json({ error: 'Interaction not found' }, 404);
        }
        console.error('Error updating interaction:', error);
        return c.json({ error: 'Failed to update interaction' }, 500);
    }
}

export async function handleDeleteInteraction(c: Context) {
    try {
        const user = getUser(c);
        const interactionId = c.req.param('id');

        if (!interactionId) {
            return c.json({ error: 'Interaction ID is required' }, 400);
        }

        const result = await interactionQueries.deleteInteraction(interactionId, user.id);

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Interaction not found') {
            return c.json({ error: 'Interaction not found' }, 404);
        }
        console.error('Error deleting interaction:', error);
        return c.json({ error: 'Failed to delete interaction' }, 500);
    }
}

export async function handleGetInteractionStats(c: Context) {
    try {
        const user = getUser(c);
        const stats = await interactionQueries.getInteractionStats(user.id);
        return c.json(stats);
    } catch (error) {
        console.error('Error fetching interaction stats:', error);
        return c.json({ error: 'Failed to fetch interaction stats' }, 500);
    }
}
