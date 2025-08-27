import { Context } from 'hono';
import { billingQueries, userQueries } from '@/db/queries';
import type { BillingInsert } from '@/db/schema/billing';
import { getWebhookData } from '@/app/api/middleware/payments';
import { isSubscriptionWebhook } from '@/payments/webhook';
import { SubscriptionWebhookPayload } from '@/payments/types';
import { getPlanFromProductId } from '@/constants/pricing';

export async function handlePaymentsWebhook(c: Context) {
    // Parse webhook data from context
    const webhookData = getWebhookData(c);
    if (!webhookData) {
        return c.json({ success: false, error: 'Invalid webhook context' }, 200);
    }

    const { webhookPayload } = webhookData;

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
        const updatedEvent = await processEntitlementUpdate(webhookPayload);
        if (!updatedEvent) {
            return c.json({ success: true, message: 'No update needed' }, 200);
        }

        const updatedBillingRecord = await billingQueries.upsertBilling(
            userRecord.id,
            updatedEvent,
        );

        return c.json(
            {
                success: true,
                message: 'Entitlements updated',
                update: {
                    userId: userRecord.id,
                    status: updatedBillingRecord.status,
                    plan: updatedBillingRecord.currentPlan,
                },
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

/**
 * Process webhook event and determine billing update
 * @returns BillingInsert | null
 * In general we retain active status in the billing table as long as the subscription is active or renewed
 * For all other events, we set the status to grace, meaning the user has access to the feature for next billing cycle or a month later whichever is later
 * After the grace period, we set the status to inactive which is a terminal state and means the user no longer has access to the feature
 */
async function processEntitlementUpdate(
    webhookPayload: SubscriptionWebhookPayload,
): Promise<Partial<BillingInsert> | null> {
    const updatedEvent: Partial<BillingInsert> = {
        provider: 'dodo',
        customerId: webhookPayload.data.customer.customer_id,
        subscriptionId: webhookPayload.data.subscription_id,
        currentPlan: getPlanFromProductId(webhookPayload.data.product_id),
        webhookEvent: webhookPayload.type,
    };

    switch (webhookPayload.type) {
        // Subscription activated
        case 'subscription.active':
            // We set the status to grace to indicate that the user has access to the feature until the trial period ends or the first payment is successful
            updatedEvent.status = 'grace';
            break;
        // Subscription renewed
        case 'subscription.renewed':
            // We set the status to active to indicate that the user has access to the feature.
            updatedEvent.status = 'active';
            break;

        // Plan changed
        case 'subscription.plan_changed':
            // We set the status to grace to indicate that the user has access to the feature until there's a successful payment
            updatedEvent.status = 'grace';
            break;

        // Subscription cancelled
        case 'subscription.cancelled':
            // We set the status to inactive to indicate that the user no longer has access to the feature. This is an explicit behavior with active user involvement hence we set the status to inactive right away.
            updatedEvent.status = 'inactive';
            break;

        // Subscription expired
        case 'subscription.expired':
            // We set the status to grace to indicate that the user has access to the feature until the grace period ends. This is implicit behavior without active user involvement.
            updatedEvent.status = 'grace';
            break;

        // Subscription failed
        case 'subscription.failed':
            // We set the status to inactive to indicate that the user does not have access to the feature due to a failed mandate. This is an explicit behavior with active user involvement hence we set the status to inactive right away.
            updatedEvent.status = 'inactive';
            break;

        // Subscription on hold
        case 'subscription.on_hold':
            // We set the status to grace to indicate that the user has access to the feature until the grace period ends. This is an implicit behavior without active user involvement.
            updatedEvent.status = 'grace';
            break;

        default:
            // Make the entitlement updates a no-op if the webhook type is not supported
            return null;
    }

    return updatedEvent;
}
