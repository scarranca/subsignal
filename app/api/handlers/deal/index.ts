import { Context } from 'hono';
import { dealQueries, activityQueries, pipelineQueries } from '@/db/queries';
import { createDealSchema, updateDealSchema, moveDealSchema, dealFilterSchema, paginationSchema } from '@/schema/api';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';
import { inngest } from '@/ingest/client';

export async function handleGetDeals(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const pagination = paginationSchema.parse(query);
        const filters = dealFilterSchema.parse(query);

        const result = await dealQueries.getUserDeals(user.id, {
            ...pagination,
            ...filters,
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching deals:', error);
        return c.json({ error: 'Failed to fetch deals' }, 500);
    }
}

export async function handleGetDeal(c: Context) {
    try {
        const user = getUser(c);
        const dealId = c.req.param('id');

        if (!dealId) {
            return c.json({ error: 'Deal ID is required' }, 400);
        }

        const result = await dealQueries.getDealById(dealId, user.id);
        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Deal not found') {
            return c.json({ error: 'Deal not found' }, 404);
        }
        console.error('Error fetching deal:', error);
        return c.json({ error: 'Failed to fetch deal' }, 500);
    }
}

export async function handleGetPipelineDeals(c: Context) {
    try {
        const user = getUser(c);
        const pipelineId = c.req.param('pipelineId');

        if (!pipelineId) {
            // Get default pipeline
            const defaultPipeline = await pipelineQueries.getDefaultPipeline(user.id);
            if (!defaultPipeline) {
                // Create default pipeline if none exists
                const newPipeline = await pipelineQueries.createDefaultPipeline(user.id);
                const result = await dealQueries.getPipelineDeals(user.id, newPipeline.id);
                return c.json(result);
            }
            const result = await dealQueries.getPipelineDeals(user.id, defaultPipeline.id);
            return c.json(result);
        }

        const result = await dealQueries.getPipelineDeals(user.id, pipelineId);
        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Pipeline not found') {
            return c.json({ error: 'Pipeline not found' }, 404);
        }
        console.error('Error fetching pipeline deals:', error);
        return c.json({ error: 'Failed to fetch pipeline deals' }, 500);
    }
}

export async function handleCreateDeal(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createDealSchema.parse(body);

        const deal = await dealQueries.createDeal(user.id, {
            name: validatedData.name,
            description: validatedData.description || null,
            value: validatedData.value?.toString() || null,
            currency: validatedData.currency,
            probability: validatedData.probability ?? null,
            priority: validatedData.priority,
            pipelineId: validatedData.pipelineId,
            stageId: validatedData.stageId,
            companyId: validatedData.companyId || null,
            contactId: validatedData.contactId || null,
            expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : null,
            tags: validatedData.tags || null,
            customFields: validatedData.customFields,
        });

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'deal',
            entityId: deal.id,
            entityName: deal.name,
            action: 'created',
            description: `Created deal "${deal.name}"`,
            relatedCompanyId: deal.companyId || undefined,
            relatedContactId: deal.contactId || undefined,
        });

        // Trigger deal created notification
        await inngest.send({
            name: 'crm/deal.created',
            data: { dealId: deal.id, userId: user.id },
        });

        return c.json(deal, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error creating deal:', error);
        return c.json({ error: 'Failed to create deal' }, 500);
    }
}

export async function handleUpdateDeal(c: Context) {
    try {
        const user = getUser(c);
        const dealId = c.req.param('id');
        const body = await c.req.json();

        if (!dealId) {
            return c.json({ error: 'Deal ID is required' }, 400);
        }

        const validatedData = updateDealSchema.parse(body);

        // Convert dates if present
        const updateData: any = { ...validatedData };
        if (validatedData.expectedCloseDate) {
            updateData.expectedCloseDate = new Date(validatedData.expectedCloseDate);
        }
        if (validatedData.actualCloseDate) {
            updateData.actualCloseDate = new Date(validatedData.actualCloseDate);
        }
        if (validatedData.value !== undefined) {
            updateData.value = validatedData.value.toString();
        }

        const updatedDeal = await dealQueries.updateDeal(dealId, user.id, updateData);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'deal',
            entityId: updatedDeal.id,
            entityName: updatedDeal.name,
            action: 'updated',
            description: `Updated deal "${updatedDeal.name}"`,
            changes: { after: validatedData },
            relatedCompanyId: updatedDeal.companyId || undefined,
            relatedContactId: updatedDeal.contactId || undefined,
        });

        return c.json(updatedDeal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Deal not found') {
            return c.json({ error: 'Deal not found' }, 404);
        }
        console.error('Error updating deal:', error);
        return c.json({ error: 'Failed to update deal' }, 500);
    }
}

export async function handleMoveDeal(c: Context) {
    try {
        const user = getUser(c);
        const dealId = c.req.param('id');
        const body = await c.req.json();

        if (!dealId) {
            return c.json({ error: 'Deal ID is required' }, 400);
        }

        const validatedData = moveDealSchema.parse(body);

        // Get deal before move to track stage change
        const dealBefore = await dealQueries.getDealById(dealId, user.id);

        const updatedDeal = await dealQueries.moveDealToStage(dealId, user.id, validatedData.stageId);

        // Log stage change activity
        const action = updatedDeal.status === 'won' ? 'deal_won' : updatedDeal.status === 'lost' ? 'deal_lost' : 'stage_changed';

        await activityQueries.logActivity(user.id, {
            entityType: 'deal',
            entityId: updatedDeal.id,
            entityName: updatedDeal.name,
            action,
            description: `Moved deal "${updatedDeal.name}" to new stage`,
            changes: {
                before: { stageId: dealBefore.stageId },
                after: { stageId: updatedDeal.stageId },
            },
            relatedCompanyId: updatedDeal.companyId || undefined,
            relatedContactId: updatedDeal.contactId || undefined,
            relatedDealId: updatedDeal.id,
        });

        // Trigger appropriate notification based on deal status
        if (updatedDeal.status === 'won') {
            await inngest.send({
                name: 'crm/deal.won',
                data: { dealId: updatedDeal.id, userId: user.id },
            });
        } else if (updatedDeal.status === 'lost') {
            await inngest.send({
                name: 'crm/deal.lost',
                data: { dealId: updatedDeal.id, userId: user.id, lostReason: validatedData.lostReason },
            });
        } else if (dealBefore.stageId !== updatedDeal.stageId) {
            // Get stage names for the notification
            const stages = await pipelineQueries.getPipelineStages(updatedDeal.pipelineId, user.id);
            const previousStage = stages.find(s => s.id === dealBefore.stageId);
            const newStage = stages.find(s => s.id === updatedDeal.stageId);

            await inngest.send({
                name: 'crm/deal.stage_changed',
                data: {
                    dealId: updatedDeal.id,
                    userId: user.id,
                    previousStage: dealBefore.stageId,
                    newStage: updatedDeal.stageId,
                    previousStageName: previousStage?.name || 'Unknown',
                    newStageName: newStage?.name || 'Unknown',
                },
            });
        }

        return c.json(updatedDeal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && (error.message === 'Deal not found' || error.message === 'Stage not found')) {
            return c.json({ error: error.message }, 404);
        }
        console.error('Error moving deal:', error);
        return c.json({ error: 'Failed to move deal' }, 500);
    }
}

export async function handleDeleteDeal(c: Context) {
    try {
        const user = getUser(c);
        const dealId = c.req.param('id');

        if (!dealId) {
            return c.json({ error: 'Deal ID is required' }, 400);
        }

        // Get deal before deletion for activity log
        const deal = await dealQueries.getDealById(dealId, user.id);

        const result = await dealQueries.deleteDeal(dealId, user.id);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'deal',
            entityId: dealId,
            entityName: deal.name,
            action: 'deleted',
            description: `Deleted deal "${deal.name}"`,
            relatedCompanyId: deal.companyId || undefined,
            relatedContactId: deal.contactId || undefined,
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Deal not found') {
            return c.json({ error: 'Deal not found' }, 404);
        }
        console.error('Error deleting deal:', error);
        return c.json({ error: 'Failed to delete deal' }, 500);
    }
}

export async function handleGetDealStats(c: Context) {
    try {
        const user = getUser(c);
        const pipelineId = c.req.query('pipelineId');

        const stats = await dealQueries.getDealStats(user.id, pipelineId);

        return c.json(stats);
    } catch (error) {
        console.error('Error fetching deal stats:', error);
        return c.json({ error: 'Failed to fetch deal stats' }, 500);
    }
}
