import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleCreateSnapshot,
    handleGetLatestSnapshotForPage,
    handleGetLatestSnapshotsForCompany,
    handleListSnapshotsForPage,
} from '@/app/api/handlers/snapshot';

const snapshots = new Hono();

/**
 * Apply auth middleware to all snapshot routes
 */
snapshots.use('*', requireAuth);

/**
 * POST /api/snapshots - Create a new snapshot for a page
 * Body: { pageId: string, type?: 'live' | 'archive' }
 */
snapshots.post('/', handleCreateSnapshot);

/**
 * GET /api/snapshots/page/:pageId/latest - Fetch the latest snapshot for a page
 * Query: ?content=diff|html|screenshot|all
 */
snapshots.get('/page/:pageId/latest', handleGetLatestSnapshotForPage);

/**
 * GET /api/snapshots/page/:pageId - List snapshots for a page with pagination
 * Query: ?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc&content=diff|html|screenshot|all
 */
snapshots.get('/page/:pageId', handleListSnapshotsForPage);

/**
 * GET /api/snapshots/company/:companyId/latest - Fetch the latest snapshots for a company
 * Query: ?content=diff|html|screenshot|all
 */
snapshots.get('/company/:companyId/latest', handleGetLatestSnapshotsForCompany);

export default snapshots;
