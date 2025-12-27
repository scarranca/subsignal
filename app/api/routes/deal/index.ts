import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetDeals,
    handleGetDeal,
    handleGetPipelineDeals,
    handleCreateDeal,
    handleUpdateDeal,
    handleMoveDeal,
    handleDeleteDeal,
    handleGetDealStats,
} from '@/app/api/handlers/deal';
import { requireBilling } from '@/app/api/middleware/billing';

const deals = new Hono();

// Apply auth middleware to all deal routes
deals.use('*', requireAuth);

// Apply billing middleware
deals.use('*', requireBilling);

// GET /api/v1/deals - List deals with pagination and filters
deals.get('/', handleGetDeals);

// GET /api/v1/deals/stats - Get deal statistics
deals.get('/stats', handleGetDealStats);

// GET /api/v1/deals/pipeline - Get deals organized by pipeline stages (Kanban view)
deals.get('/pipeline', handleGetPipelineDeals);

// GET /api/v1/deals/pipeline/:pipelineId - Get deals for specific pipeline
deals.get('/pipeline/:pipelineId', handleGetPipelineDeals);

// GET /api/v1/deals/:id - Get specific deal
deals.get('/:id', handleGetDeal);

// POST /api/v1/deals - Create new deal
deals.post('/', handleCreateDeal);

// PATCH /api/v1/deals/:id - Update deal
deals.patch('/:id', handleUpdateDeal);

// POST /api/v1/deals/:id/move - Move deal to different stage
deals.post('/:id/move', handleMoveDeal);

// DELETE /api/v1/deals/:id - Soft delete deal
deals.delete('/:id', handleDeleteDeal);

export default deals;
