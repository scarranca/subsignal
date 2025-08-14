import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetCompanies,
    handleGetCompany,
    handleCreateCompany,
    handleUpdateCompany,
    handleDeleteCompany,
} from '@/app/api/handlers/company';

const companies = new Hono();

/**
 * Apply auth middleware to all company routes
 */
companies.use('*', requireAuth);

/**
 * GET /api/companies - Fetch user companies with pagination
 */
companies.get('/', handleGetCompanies);

/**
 * GET /api/companies/:id - Fetch specific company
 */
companies.get('/:id', handleGetCompany);

/**
 * POST /api/companies - Create new company
 */
companies.post('/', handleCreateCompany);

/**
 * PATCH /api/companies/:id - Update company
 */
companies.patch('/:id', handleUpdateCompany);

/**
 * DELETE /api/companies/:id - Soft delete company
 */
companies.delete('/:id', handleDeleteCompany);

export default companies;