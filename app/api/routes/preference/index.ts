import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPreference,
    handleUpsertPreference,
    handleDeletePreference,
} from '@/app/api/handlers/preference';
import { injectLimits, injectUsage } from '@/app/api/middleware/entitlement';

const preferences = new Hono();

/**
 * Apply auth middleware to all preference routes
 */
preferences.use('*', requireAuth, injectLimits, injectUsage);

/**
 * GET /api/preferences - Fetch user preference
 */
preferences.get('/', handleGetPreference);

/**
 * DELETE /api/preferences - Soft delete user preference
 */
preferences.delete('/', handleDeletePreference);

/**
 * POST /api/preferences - Create or update user preference
 */
preferences.post('/', handleUpsertPreference);

/**
 * PUT /api/preferences - Create or update user preference
 */
preferences.put('/', handleUpsertPreference);

export default preferences;
