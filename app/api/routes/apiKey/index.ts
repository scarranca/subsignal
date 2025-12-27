import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetApiKeys,
    handleCreateApiKey,
    handleUpdateApiKey,
    handleDeleteApiKey,
    handleRegenerateApiKey,
    handleGetApiKeyStats,
} from '@/app/api/handlers/apiKey';

const apiKeys = new Hono();

// Apply auth middleware to all API key management routes
apiKeys.use('*', requireAuth);

// GET /api/v1/api-keys - List all API keys
apiKeys.get('/', handleGetApiKeys);

// POST /api/v1/api-keys - Create new API key
apiKeys.post('/', handleCreateApiKey);

// GET /api/v1/api-keys/:id/stats - Get API key usage stats
apiKeys.get('/:id/stats', handleGetApiKeyStats);

// PATCH /api/v1/api-keys/:id - Update API key
apiKeys.patch('/:id', handleUpdateApiKey);

// DELETE /api/v1/api-keys/:id - Delete API key
apiKeys.delete('/:id', handleDeleteApiKey);

// POST /api/v1/api-keys/:id/regenerate - Regenerate API key
apiKeys.post('/:id/regenerate', handleRegenerateApiKey);

export default apiKeys;
