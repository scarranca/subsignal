import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetCompanies,
    handleGetCompany,
    handleCreateCompany,
    handleUpdateCompany,
    handleDeleteCompany,
    handleBatchCreateCompanies,
} from '@/app/api/handlers/company';
import { requireBilling } from '@/app/api/middleware/billing';

const companies = new Hono();

/**
 * Apply auth middleware to all company routes
 */
companies.use('*', requireAuth);

/**
 * POST /api/companies/batch - Batch create companies from URLs
 */
companies.post('/batch', handleBatchCreateCompanies);

/**
 * GET /api/companies - Fetch user companies with pagination
 */
companies.get('/', handleGetCompanies);

/**
 * Billing is required for all company routes except the batch create route and get all companies route required in the onboarding flow
 */
companies.use('*', requireBilling);

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
