import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPagesByUser,
    handleGetPage,
    handleCreatePage,
    handleUpdatePage,
    handleBulkDeletePages,
} from '@/app/api/handlers/page';

const pages = new Hono();

/**
 * Apply auth middleware to all page routes
 */
pages.use('*', requireAuth);

/**
 * GET /api/pages - Fetch user pages with pagination
 */
pages.get('/', handleGetPagesByUser);

/**
 * GET /api/pages/:id - Fetch a specific page
 */
pages.get('/:id', handleGetPage);

/**
 * POST /api/pages - Create a new page
 */
pages.post('/', handleCreatePage);

/**
 * PATCH /api/pages/:id - Update a page
 */
pages.patch('/:id', handleUpdatePage);

/**
 * DELETE /api/pages - Delete pages
 */
pages.delete('/', handleBulkDeletePages);

export default pages;
