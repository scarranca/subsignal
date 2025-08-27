import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPaymentStatus,
    handlePaymentsWebhook,
    handleCreateNewSubscription,
    handleValidatePaymentStatus,
} from '@/app/api/handlers/billing';
import { verifyDodoWebhook } from '../../middleware/payments';
import { handleUpdateExistingSubscription } from '../../handlers/billing/checkout';

const payments = new Hono();

/**
 * GET api/v1/payments - Get user payment status
 */
payments.get('/', requireAuth, handleGetPaymentStatus);

/**
 * POST api/v1/payments - Create new subscription
 */
payments.post('/', requireAuth, handleCreateNewSubscription);

/**
 * PUT api/v1/payments - Update existing subscription
 */
payments.put('/', requireAuth, handleUpdateExistingSubscription);

/**
 * GET api/v1/payments/validate - Validate payment status
 */
payments.get('/validate', requireAuth, handleValidatePaymentStatus);

/**
 * POST api/v1/payments/webhooks - Handle Dodo payment webhooks
 */
payments.post('/webhooks', verifyDodoWebhook, handlePaymentsWebhook);

export default payments;
