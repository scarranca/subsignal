import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetInteractions,
    handleGetInteraction,
    handleGetEntityTimeline,
    handleCreateInteraction,
    handleUpdateInteraction,
    handleDeleteInteraction,
    handleGetInteractionStats,
} from '@/app/api/handlers/interaction';
import { requireBilling } from '@/app/api/middleware/billing';

const interactions = new Hono();

// Apply auth middleware to all interaction routes
interactions.use('*', requireAuth);

// Apply billing middleware
interactions.use('*', requireBilling);

// GET /api/v1/interactions - List interactions with pagination and filters
interactions.get('/', handleGetInteractions);

// GET /api/v1/interactions/stats - Get interaction statistics
interactions.get('/stats', handleGetInteractionStats);

// GET /api/v1/interactions/timeline/:entityType/:entityId - Get timeline for entity
interactions.get('/timeline/:entityType/:entityId', handleGetEntityTimeline);

// GET /api/v1/interactions/:id - Get specific interaction
interactions.get('/:id', handleGetInteraction);

// POST /api/v1/interactions - Create new interaction
interactions.post('/', handleCreateInteraction);

// PATCH /api/v1/interactions/:id - Update interaction
interactions.patch('/:id', handleUpdateInteraction);

// DELETE /api/v1/interactions/:id - Soft delete interaction
interactions.delete('/:id', handleDeleteInteraction);

export default interactions;
