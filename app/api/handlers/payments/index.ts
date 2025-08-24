import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { billingQueries } from '@/db/queries';
import { user } from '@/db/schema/auth';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import { DODO_PRODUCT_ID_MAPPING, PLAN_ID_MAPPING } from '@/constants/pricing';
import { Webhook } from 'standardwebhooks';

// Create reverse mapping from product IDs to plan types
const getProductIdToPlanMapping = () => {
    const mapping: Record<string, keyof typeof PLAN_ID_MAPPING> = {};
    for (const [planType, productId] of Object.entries(DODO_PRODUCT_ID_MAPPING)) {
        mapping[productId] = planType as keyof typeof PLAN_ID_MAPPING;
    }
    return mapping;
};

// Always return 200 to acknowledge webhook receipt (prevents retries)
interface WebhookResponseData {
    message?: string;
    processingTime?: number;
    user?: string;
    billing?: {
        isPaying: boolean;
        currentPlan: string | null;
    };
    error?: string;
}

export function createWebhookResponse(c: Context, success: boolean, data: WebhookResponseData) {
    if (success) {
        return c.json(data, 200);
    }

    console.error('[WEBHOOK ERROR]:', data.message);
    return c.json({ success: false, error: data.message }, 200);
}

export const getUser = (c: Context) => {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to get user payment status
 */
export async function handleGetPaymentStatus(c: Context) {
    try {
        console.log('[PAYMENT STATUS] Starting payment status check');
        const user = getUser(c);

        const billingRecord = await billingQueries.getBillingByUserId(user.id);

        if (!billingRecord) {
            console.log('[PAYMENT STATUS] No billing record found for user:', user.email);
            const noBillingResponse = {
                isPaying: false,
                currentPlan: null,
                userName: user.name,
                userEmail: user.email,
            };
            return c.json(noBillingResponse);
        }

        console.log('[PAYMENT STATUS] Billing record found:', {
            isPaying: billingRecord.isPaying,
            currentPlan: billingRecord.currentPlan,
            userId: billingRecord.userId,
        });

        const response = {
            isPaying: billingRecord.isPaying,
            currentPlan: billingRecord.currentPlan,
            userName: user.name,
            userEmail: user.email,
        };

        return c.json(response);
    } catch (error) {
        console.error('[PAYMENT STATUS] Error fetching payment status:', error);
        return c.json({ error: 'Failed to fetch payment status' }, 500);
    }
}

/**
 * Handle Dodo payment webhooks
 */
export async function handleWebhook(c: Context) {
    const startTime = Date.now();
    console.log('[WEBHOOK] Starting webhook processing');

    try {
        // Check webhook key configuration
        const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
        if (!webhookKey) {
            console.error('[WEBHOOK] CRITICAL: DODO_PAYMENTS_WEBHOOK_KEY not configured');
            return createWebhookResponse(c, false, {
                message: 'Webhook key not configured',
            });
        }

        // Get request data
        const rawBody = await c.req.text();
        const headers = c.req.header();

        console.log('[WEBHOOK] Request details:', {
            method: c.req.method,
            bodyLength: rawBody.length,
            hasWebhookId: !!headers['webhook-id'],
            hasSignature: !!headers['webhook-signature'],
            hasTimestamp: !!headers['webhook-timestamp'],
        });

        // Extract webhook headers
        const webhookHeaders = {
            'webhook-id': headers['webhook-id'] || '',
            'webhook-signature': headers['webhook-signature'] || '',
            'webhook-timestamp': headers['webhook-timestamp'] || '',
        };

        // Verify webhook signature
        try {
            const webhook = new Webhook(webhookKey);
            await webhook.verify(rawBody, webhookHeaders);
            console.log('[WEBHOOK] Signature verified successfully');
        } catch (verifyError) {
            console.error('[WEBHOOK] Signature verification failed:', verifyError);
            return createWebhookResponse(c, false, {
                message: 'Webhook signature verification failed',
            });
        }

        // Parse payload
        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch (parseError) {
            console.error('[WEBHOOK] Failed to parse JSON payload:', parseError);
            return createWebhookResponse(c, false, {
                message: 'Invalid JSON payload',
            });
        }

        console.log('[WEBHOOK] Payload received:', {
            type: payload.type,
            hasCustomer: !!payload.data?.customer,
            hasProductId: !!payload.data?.product_id,
        });

        // Extract customer email
        const customerEmail = payload.data?.customer?.email;
        if (!customerEmail) {
            console.error('[WEBHOOK] Missing customer email in payload');
            return createWebhookResponse(c, false, {
                message: 'Missing customer email in payload',
            });
        }

        // Look up user
        const userRecord = await db.query.user.findFirst({
            where: eq(user.email, customerEmail),
        });

        if (!userRecord) {
            console.error('[WEBHOOK] User not found for email:', customerEmail);
            return createWebhookResponse(c, false, {
                message: `User not found for email: ${customerEmail}`,
            });
        }

        console.log('[WEBHOOK] User found:', {
            id: userRecord.id,
            email: userRecord.email,
        });

        // Determine payment status
        const webhookType = payload.type;
        const payloadType = payload.data?.payload_type;
        const payloadStatus = payload.data?.status;

        let isPaying = false;
        if (
            webhookType === 'payment.succeeded' ||
            (payloadType === 'Subscription' && payloadStatus === 'active') ||
            (webhookType === 'subscription.created' && payloadStatus === 'active')
        ) {
            isPaying = true;
        }

        if (webhookType === 'subscription.cancelled' || payloadStatus === 'cancelled') {
            isPaying = false;
        }

        // Determine plan from product ID
        const productId = payload.data?.product_id;
        let currentPlan = null;

        if (productId) {
            const productIdToPlanMapping = getProductIdToPlanMapping();
            const planType = productIdToPlanMapping[productId];
            if (planType) {
                currentPlan = PLAN_ID_MAPPING[planType];
            }
        }

        console.log('[WEBHOOK] Payment analysis:', {
            isPaying,
            currentPlan,
            webhookType,
            payloadStatus,
        });

        // Update or create billing record
        const billingData = {
            isPaying,
            currentPlan: isPaying ? currentPlan : null,
        };

        console.log('[WEBHOOK] Upserting billing record');
        try {
            await billingQueries.upsertBilling(userRecord.id, billingData);
        } catch (dbError) {
            console.error('[WEBHOOK] Database operation failed:', dbError);
            return createWebhookResponse(c, false, {
                message: 'Failed to update billing record',
                processingTime: Date.now() - startTime,
            });
        }

        const processingTime = Date.now() - startTime;
        console.log('[WEBHOOK] Processed successfully in', processingTime, 'ms');

        return createWebhookResponse(c, true, {
            message: 'Webhook processed successfully',
            processingTime,
            user: userRecord.email,
            billing: {
                isPaying,
                currentPlan: isPaying ? currentPlan : null,
            },
        });
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('[WEBHOOK] Processing failed after', processingTime, 'ms:', error);

        // For any other unexpected errors, treat as server errors to allow retries
        return createWebhookResponse(c, false, {
            message: error instanceof Error ? error.message : String(error),
            processingTime,
        });
    }
}
