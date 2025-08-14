import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPreference,
    handleUpsertPreference,
    handleDeletePreference,
} from '@/app/api/handlers/preference';

const preferences = new Hono();

/**
 * Apply auth middleware to all preference routes
 */
preferences.use('*', requireAuth);

/**
 * GET /api/preferences - Fetch user preference
 */
preferences.get('/', handleGetPreference);

/**
 * POST /api/preferences - Create or update user preference
 */
preferences.post('/', handleUpsertPreference);

/**
 * PUT /api/preferences - Create or update user preference
 */
preferences.put('/', handleUpsertPreference);

/**
 * DELETE /api/preferences - Soft delete user preference
 */
preferences.delete('/', handleDeletePreference);

export default preferences;
