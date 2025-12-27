import { Context } from 'hono';
import { pipelineQueries, activityQueries } from '@/db/queries';
import { createPipelineSchema, updatePipelineSchema, reorderStagesSchema } from '@/schema/api';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';

export async function handleGetPipelines(c: Context) {
    try {
        const user = getUser(c);
        const pipelines = await pipelineQueries.getUserPipelines(user.id);
        return c.json({ data: pipelines });
    } catch (error) {
        console.error('Error fetching pipelines:', error);
        return c.json({ error: 'Failed to fetch pipelines' }, 500);
    }
}

export async function handleGetPipeline(c: Context) {
    try {
        const user = getUser(c);
        const pipelineId = c.req.param('id');

        if (!pipelineId) {
            return c.json({ error: 'Pipeline ID is required' }, 400);
        }

        const result = await pipelineQueries.getPipelineById(pipelineId, user.id);
        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Pipeline not found') {
            return c.json({ error: 'Pipeline not found' }, 404);
        }
        console.error('Error fetching pipeline:', error);
        return c.json({ error: 'Failed to fetch pipeline' }, 500);
    }
}

export async function handleCreatePipeline(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createPipelineSchema.parse(body);

        const pipeline = await pipelineQueries.createPipeline(user.id, validatedData);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'pipeline',
            entityId: pipeline.id,
            entityName: pipeline.name,
            action: 'created',
            description: `Created pipeline "${pipeline.name}"`,
        });

        return c.json(pipeline, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error creating pipeline:', error);
        return c.json({ error: 'Failed to create pipeline' }, 500);
    }
}

export async function handleCreateDefaultPipeline(c: Context) {
    try {
        const user = getUser(c);

        // Check if user already has a default pipeline
        const existing = await pipelineQueries.getDefaultPipeline(user.id);
        if (existing) {
            return c.json({ error: 'Default pipeline already exists' }, 409);
        }

        const pipeline = await pipelineQueries.createDefaultPipeline(user.id);

        return c.json(pipeline, 201);
    } catch (error) {
        console.error('Error creating default pipeline:', error);
        return c.json({ error: 'Failed to create default pipeline' }, 500);
    }
}

export async function handleUpdatePipeline(c: Context) {
    try {
        const user = getUser(c);
        const pipelineId = c.req.param('id');
        const body = await c.req.json();

        if (!pipelineId) {
            return c.json({ error: 'Pipeline ID is required' }, 400);
        }

        const validatedData = updatePipelineSchema.parse(body);

        const updatedPipeline = await pipelineQueries.updatePipeline(pipelineId, user.id, validatedData);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'pipeline',
            entityId: updatedPipeline.id,
            entityName: updatedPipeline.name,
            action: 'updated',
            description: `Updated pipeline "${updatedPipeline.name}"`,
            changes: { after: validatedData },
        });

        return c.json(updatedPipeline);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Pipeline not found') {
            return c.json({ error: 'Pipeline not found' }, 404);
        }
        console.error('Error updating pipeline:', error);
        return c.json({ error: 'Failed to update pipeline' }, 500);
    }
}

export async function handleDeletePipeline(c: Context) {
    try {
        const user = getUser(c);
        const pipelineId = c.req.param('id');

        if (!pipelineId) {
            return c.json({ error: 'Pipeline ID is required' }, 400);
        }

        const result = await pipelineQueries.deletePipeline(pipelineId, user.id);

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Pipeline not found') {
            return c.json({ error: 'Pipeline not found' }, 404);
        }
        console.error('Error deleting pipeline:', error);
        return c.json({ error: 'Failed to delete pipeline' }, 500);
    }
}

export async function handleAddStage(c: Context) {
    try {
        const user = getUser(c);
        const pipelineId = c.req.param('id');
        const body = await c.req.json();

        if (!pipelineId) {
            return c.json({ error: 'Pipeline ID is required' }, 400);
        }

        const stage = await pipelineQueries.addPipelineStage(pipelineId, user.id, body);

        return c.json(stage, 201);
    } catch (error) {
        if (error instanceof Error && error.message === 'Pipeline not found') {
            return c.json({ error: 'Pipeline not found' }, 404);
        }
        console.error('Error adding stage:', error);
        return c.json({ error: 'Failed to add stage' }, 500);
    }
}

export async function handleUpdateStage(c: Context) {
    try {
        const user = getUser(c);
        const stageId = c.req.param('stageId');
        const body = await c.req.json();

        if (!stageId) {
            return c.json({ error: 'Stage ID is required' }, 400);
        }

        const stage = await pipelineQueries.updatePipelineStage(stageId, user.id, body);

        return c.json(stage);
    } catch (error) {
        if (error instanceof Error && error.message === 'Stage not found') {
            return c.json({ error: 'Stage not found' }, 404);
        }
        console.error('Error updating stage:', error);
        return c.json({ error: 'Failed to update stage' }, 500);
    }
}

export async function handleDeleteStage(c: Context) {
    try {
        const user = getUser(c);
        const stageId = c.req.param('stageId');

        if (!stageId) {
            return c.json({ error: 'Stage ID is required' }, 400);
        }

        const result = await pipelineQueries.deletePipelineStage(stageId, user.id);

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Stage not found') {
            return c.json({ error: 'Stage not found' }, 404);
        }
        console.error('Error deleting stage:', error);
        return c.json({ error: 'Failed to delete stage' }, 500);
    }
}

export async function handleReorderStages(c: Context) {
    try {
        const user = getUser(c);
        const pipelineId = c.req.param('id');
        const body = await c.req.json();

        if (!pipelineId) {
            return c.json({ error: 'Pipeline ID is required' }, 400);
        }

        const validatedData = reorderStagesSchema.parse(body);

        const stages = await pipelineQueries.reorderStages(pipelineId, user.id, validatedData.stages);

        return c.json({ stages });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Pipeline not found') {
            return c.json({ error: 'Pipeline not found' }, 404);
        }
        console.error('Error reordering stages:', error);
        return c.json({ error: 'Failed to reorder stages' }, 500);
    }
}
