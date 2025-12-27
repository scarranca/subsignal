import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPipelines,
    handleGetPipeline,
    handleCreatePipeline,
    handleCreateDefaultPipeline,
    handleUpdatePipeline,
    handleDeletePipeline,
    handleAddStage,
    handleUpdateStage,
    handleDeleteStage,
    handleReorderStages,
} from '@/app/api/handlers/pipeline';
import { requireBilling } from '@/app/api/middleware/billing';

const pipelines = new Hono();

// Apply auth middleware to all pipeline routes
pipelines.use('*', requireAuth);

// Apply billing middleware
pipelines.use('*', requireBilling);

// GET /api/v1/pipelines - List all pipelines
pipelines.get('/', handleGetPipelines);

// POST /api/v1/pipelines/default - Create default pipeline
pipelines.post('/default', handleCreateDefaultPipeline);

// GET /api/v1/pipelines/:id - Get specific pipeline with stages
pipelines.get('/:id', handleGetPipeline);

// POST /api/v1/pipelines - Create new pipeline
pipelines.post('/', handleCreatePipeline);

// PATCH /api/v1/pipelines/:id - Update pipeline
pipelines.patch('/:id', handleUpdatePipeline);

// DELETE /api/v1/pipelines/:id - Soft delete pipeline
pipelines.delete('/:id', handleDeletePipeline);

// POST /api/v1/pipelines/:id/stages - Add stage to pipeline
pipelines.post('/:id/stages', handleAddStage);

// PUT /api/v1/pipelines/:id/stages/reorder - Reorder stages
pipelines.put('/:id/stages/reorder', handleReorderStages);

// PATCH /api/v1/pipelines/:id/stages/:stageId - Update stage
pipelines.patch('/:id/stages/:stageId', handleUpdateStage);

// DELETE /api/v1/pipelines/:id/stages/:stageId - Delete stage
pipelines.delete('/:id/stages/:stageId', handleDeleteStage);

export default pipelines;
