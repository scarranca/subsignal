import { Context } from 'hono';
import { userQueries } from '@/db/queries';
import { getWebhookData } from '@/app/api/middleware/payments';
import { isSubscriptionWebhook } from '@/payments/webhook';
import { billingService } from '@/services/billing';

export async function handlePaymentsWebhook(c: Context) {
    // Parse webhook data from context
    const webhookData = getWebhookData(c);
    if (!webhookData) {
        return c.json({ success: false, error: 'Invalid webhook context' }, 200);
    }

    const { webhookPayload } = webhookData;

    // console.log('Received webhook payload', webhookPayload);

    // Ignore all non-subscription events
    if (!isSubscriptionWebhook(webhookPayload)) {
        return c.json({ success: true, message: 'Ignored non-subscription event' }, 200);
    }

    try {
        const customerEmail = webhookPayload.data.customer.email;
        if (!customerEmail) {
            return c.json(
                { success: true, message: 'Customer email unavailable in webhook payload' },
                200,
            );
        }

        const userRecord = await userQueries.getUserRecordByEmail(customerEmail);
        if (!userRecord) {
            return c.json({ success: true, message: 'Customer record unavailable' }, 200);
        }

        // Process the event
        await billingService.processSubscription(userRecord.id, webhookPayload);

        return c.json(
            {
                success: true,
                message: 'Subscription processed',
            },
            200,
        );
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Processing failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            200,
        );
    }
}
