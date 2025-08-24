import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import { handleGetPaymentStatus, handleWebhook } from '@/app/api/handlers/payments';

const payments = new Hono();

/**
 * GET api/v1/payments/status - Get user payment status
 */
payments.get('/status', requireAuth, handleGetPaymentStatus);

/**
 * POST api/v1/payments/webhooks - Handle Dodo payment webhooks
 */
payments.post('/webhooks', handleWebhook);

export default payments;
