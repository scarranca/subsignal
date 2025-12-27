import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetActivities,
    handleGetRecentActivities,
    handleGetEntityActivities,
    handleGetActivityStats,
} from '@/app/api/handlers/activity';
import { requireBilling } from '@/app/api/middleware/billing';

const activities = new Hono();

// Apply auth middleware to all activity routes
activities.use('*', requireAuth);

// Apply billing middleware
activities.use('*', requireBilling);

// GET /api/v1/activities - List activities with pagination and filters
activities.get('/', handleGetActivities);

// GET /api/v1/activities/recent - Get recent activities
activities.get('/recent', handleGetRecentActivities);

// GET /api/v1/activities/stats - Get activity statistics
activities.get('/stats', handleGetActivityStats);

// GET /api/v1/activities/:entityType/:entityId - Get activities for specific entity
activities.get('/:entityType/:entityId', handleGetEntityActivities);

export default activities;
