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
import { injectLimits, injectUsage } from '@/app/api/middleware/entitlement';

const companies = new Hono();

/**
 * Apply auth middleware to all company routes
 * Usage is injected for all company routes
 */
companies.use('*', requireAuth, injectUsage);

/**
 * POST /api/companies/batch - Batch create companies from URLs
 * Limits are injected for the batch create companies route to prevent abuse
 */
companies.post('/batch', injectLimits, handleBatchCreateCompanies);

/**
 * GET /api/companies - Fetch user companies with pagination
 * Limits are injected for the get all companies route to prevent abuse
 */
companies.get('/', injectLimits, handleGetCompanies);

/**
 * Billing is required for all company routes except the batch create route and get all companies route required in the onboarding flow
 * Limits are injected for all company routes except the batch create route and get all companies route required in the onboarding flow
 */
companies.use('*', requireBilling, injectLimits);

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
