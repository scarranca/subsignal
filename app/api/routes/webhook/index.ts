import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetWebhooks,
    handleGetWebhook,
    handleCreateWebhook,
    handleUpdateWebhook,
    handleDeleteWebhook,
    handleRegenerateWebhookSecret,
    handleTestWebhook,
    handleGetWebhookDeliveries,
    handleGetWebhookEvents,
} from '@/app/api/handlers/webhook';

const webhooks = new Hono();

// Apply auth middleware to all routes
webhooks.use('*', requireAuth);

// GET /api/v1/webhooks/events - Get available webhook events
webhooks.get('/events', handleGetWebhookEvents);

// GET /api/v1/webhooks - List all webhooks
webhooks.get('/', handleGetWebhooks);

// POST /api/v1/webhooks - Create new webhook
webhooks.post('/', handleCreateWebhook);

// GET /api/v1/webhooks/:id - Get single webhook
webhooks.get('/:id', handleGetWebhook);

// PATCH /api/v1/webhooks/:id - Update webhook
webhooks.patch('/:id', handleUpdateWebhook);

// DELETE /api/v1/webhooks/:id - Delete webhook
webhooks.delete('/:id', handleDeleteWebhook);

// POST /api/v1/webhooks/:id/regenerate - Regenerate secret
webhooks.post('/:id/regenerate', handleRegenerateWebhookSecret);

// POST /api/v1/webhooks/:id/test - Test webhook
webhooks.post('/:id/test', handleTestWebhook);

// GET /api/v1/webhooks/:id/deliveries - Get delivery history
webhooks.get('/:id/deliveries', handleGetWebhookDeliveries);

export default webhooks;
