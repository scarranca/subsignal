import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPagesByCompany,
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
 * GET /api/pages - Fetch all pages for user with pagination
 */
pages.get('/', handleGetPagesByUser);

/**
 * GET /api/pages/:id - Fetch specific page
 */
pages.get('/:id', handleGetPage);

/**
 * GET /api/pages/company/:companyId - Fetch pages by company with pagination
 */
pages.get('/company/:companyId', handleGetPagesByCompany);

/**
 * POST /api/pages - Create new page
 */
pages.post('/', handleCreatePage);

/**
 * PATCH /api/pages/:id - Update page
 */
pages.patch('/:id', handleUpdatePage);

/**
 * DELETE /api/pages - Delete pages (supports single or multiple page IDs)
 */
pages.delete('/', handleBulkDeletePages);

export default pages;
