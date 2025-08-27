import { Context } from 'hono';
import { billingQueries, userQueries } from '@/db/queries';
import type { BillingInsert } from '@/db/schema/billing';
import { getWebhookData } from '@/app/api/middleware/payments';
import { isSubscriptionWebhook } from '@/payments/webhook';
import DodoWebhookPayload, { SubscriptionWebhookPayload } from '@/payments/types';
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
            return c.json({ success: true, message: 'No customer email' }, 200);
        }

        const userRecord = await userQueries.getUserRecordByEmail(customerEmail);
        if (!userRecord) {
            return c.json({ success: true, message: 'User not found' }, 200);
        }

        // Process the event
        const updatedEvent = await processEntitlementUpdate(webhookPayload);

        if (updatedEvent) {
            // Always update billing record to stay in sync with upstream
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
        }

        return c.json(
            {
                success: true,
                message: 'No update needed',
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
    switch (webhookPayload.type) {
        // Subscription activated
        case 'subscription.active':
            return handleSubscriptionActive(webhookPayload);

        // Plan changed
        case 'subscription.plan_changed':
            return handleSubscriptionPlanChanged(webhookPayload);

        // Subscription cancelled
        case 'subscription.cancelled':
            return handleSubscriptionCancelled(webhookPayload);

        // Subscription expired
        case 'subscription.expired':
            return handleSubscriptionExpired(webhookPayload);

        // Subscription failed
        case 'subscription.failed':
            return handleSubscriptionFailed(webhookPayload);

        // Subscription on hold (payment issue)
        case 'subscription.on_hold':
            return handleSubscriptionOnHold(webhookPayload);

        default:
            return null;
    }
}

/**
 * Handle subscription active events.
 * Indicates that a subscription is now active and recurring charges are scheduled.
 */
function handleSubscriptionActive(
    webhookPayload: DodoWebhookPayload,
): Partial<BillingInsert> | null {
    if (!isSubscriptionWebhook(webhookPayload)) {
        return null;
    }

    const data = webhookPayload.data;
    const plan = getPlanFromProductId(data.product_id);

    return {
        status: 'active',
        currentPlan: plan,
        provider: 'dodo',
        subscriptionId: data.subscription_id,
        customerId: data.customer.customer_id,
    };
}

/**
 * Handle subscription renewed events.
 * Occurs when a subscription is successfully renewed.
 */
// function handleSubscriptionRenewed(
//     webhookPayload: DodoWebhookPayload,
// ): Partial<BillingInsert> | null {
//     if (!isSubscriptionWebhook(webhookPayload)) {
//         return null;
//     }

//     const data = webhookPayload.data;
//     const plan = getPlanFromProductId(data.product_id);

//     return {
//         status: 'renewed',
//         currentPlan: plan,
//         provider: 'dodo',
//         subscriptionId: data.subscription_id,
//         customerId: data.customer.customer_id,
//     };
// }

/**
 * Handle subscription plan changed events.
 * Triggered when a subscription is upgraded, downgraded, or modified with different addons.
 */
function handleSubscriptionPlanChanged(
    webhookPayload: DodoWebhookPayload,
): Partial<BillingInsert> | null {
    if (!isSubscriptionWebhook(webhookPayload)) {
        return null;
    }

    const data = webhookPayload.data;
    const newPlan = getPlanFromProductId(data.product_id);

    return {
        status: 'active',
        currentPlan: newPlan,
        subscriptionId: data.subscription_id,
        customerId: data.customer.customer_id,
    };
}

/**
 * Handle subscription cancelled events.
 * Triggered when a subscription is cancelled.
 */
function handleSubscriptionCancelled(
    webhookPayload: DodoWebhookPayload,
): Partial<BillingInsert> | null {
    if (!isSubscriptionWebhook(webhookPayload)) {
        return null;
    }

    const data = webhookPayload.data;
    const plan = getPlanFromProductId(data.product_id);

    return {
        status: 'inactive',
        currentPlan: plan,
        subscriptionId: data.subscription_id,
        customerId: data.customer.customer_id,
    };
}

/**
 * Handle subscription expired events.
 * Triggered when a subscription reaches the end of its term and expires.
 */
function handleSubscriptionExpired(
    webhookPayload: DodoWebhookPayload,
): Partial<BillingInsert> | null {
    if (!isSubscriptionWebhook(webhookPayload)) {
        return null;
    }

    const data = webhookPayload.data;
    const plan = getPlanFromProductId(data.product_id);

    return {
        status: 'inactive',
        currentPlan: plan,
        subscriptionId: data.subscription_id,
        customerId: data.customer.customer_id,
    };
}

/**
 * Handle subscription failed events.
 * Indicates a failed subscription. This means that we were unable to create a mandate.
 */
function handleSubscriptionFailed(
    webhookPayload: DodoWebhookPayload,
): Partial<BillingInsert> | null {
    if (!isSubscriptionWebhook(webhookPayload)) {
        return null;
    }

    const data = webhookPayload.data;
    const plan = getPlanFromProductId(data.product_id);

    return {
        status: 'grace',
        currentPlan: plan,
        subscriptionId: data.subscription_id,
        customerId: data.customer.customer_id,
    };
}

/**
 * Handle subscription on hold events.
 * Triggered when a subscription is temporarily put on hold due to failed renewal.
 */
function handleSubscriptionOnHold(
    webhookPayload: DodoWebhookPayload,
): Partial<BillingInsert> | null {
    if (!isSubscriptionWebhook(webhookPayload)) {
        return null;
    }

    const data = webhookPayload.data;
    const plan = getPlanFromProductId(data.product_id);

    return {
        status: 'grace',
        currentPlan: plan,
        subscriptionId: data.subscription_id,
        customerId: data.customer.customer_id,
    };
}
