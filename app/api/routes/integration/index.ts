import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetIntegrations,
    handleGetIntegration,
    handleGetGoogleAuthUrl,
    handleGoogleCallback,
    handleUpdateIntegration,
    handleDisconnectIntegration,
    handleTriggerSync,
    handleGetSyncStatus,
    handleSendEmail,
    handleCreateCalendarEvent,
} from '@/app/api/handlers/integration';

const integrations = new Hono();

// Google OAuth callback - no auth required (state contains user info)
integrations.get('/google/callback', handleGoogleCallback);

// Apply auth middleware to all other routes
integrations.use('*', requireAuth);

// GET /api/v1/integrations - List all integrations
integrations.get('/', handleGetIntegrations);

// GET /api/v1/integrations/google/auth - Get Google OAuth URL
integrations.get('/google/auth', handleGetGoogleAuthUrl);

// GET /api/v1/integrations/:id - Get specific integration
integrations.get('/:id', handleGetIntegration);

// GET /api/v1/integrations/:id/status - Get sync status
integrations.get('/:id/status', handleGetSyncStatus);

// PATCH /api/v1/integrations/:id - Update integration settings
integrations.patch('/:id', handleUpdateIntegration);

// DELETE /api/v1/integrations/:id - Disconnect integration
integrations.delete('/:id', handleDisconnectIntegration);

// POST /api/v1/integrations/:id/sync - Trigger manual sync
integrations.post('/:id/sync', handleTriggerSync);

// POST /api/v1/integrations/:id/send-email - Send email via Gmail
integrations.post('/:id/send-email', handleSendEmail);

// POST /api/v1/integrations/:id/create-event - Create calendar event
integrations.post('/:id/create-event', handleCreateCalendarEvent);

export default integrations;
