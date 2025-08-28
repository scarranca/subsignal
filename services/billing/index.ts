import { getPlanFromProductId } from '@/constants/pricing';
import { billingQueries } from '@/db/queries/billing';
import { BillingInsert } from '@/db/schema/billing';
import { dodopayments } from '@/payments/dodo';
import { SubscriptionWebhookPayload } from '@/payments/types';

export class BillingService {
    private static instance: BillingService;

    private constructor() {}

    static getInstance(): BillingService {
        if (!BillingService.instance) {
            BillingService.instance = new BillingService();
        }
        return BillingService.instance;
    }

    async activateSubscription(subscriptionData: BillingInsert) {
        // Triggered on subscription.renew
        const { createdSubscription, updatedSubscription, renewedSubscription, billingRecord } =
            await billingQueries.activateSubscription(subscriptionData.userId, {
                productId: subscriptionData.productId!,
                subscriptionId: subscriptionData.subscriptionId!,
                customerId: subscriptionData.customerId!,
                status: 'active',
                provider: subscriptionData.provider,
                webhookEvent: subscriptionData.webhookEvent,
                currentPlan: subscriptionData.currentPlan,
            });

        if (createdSubscription) {
            // FTU is activating their subscription
            // Send onboarding email to the user
            // Kickoff the gated onboarding event
            console.log('FTU is activating their subscription, sending onboarding email...');
            console.log('Kicking off gated onboarding event...');
        } else if (updatedSubscription) {
            // RTU is updating their subscription
            // Send email confirming plan change for the user
            console.log('RTU is updating their subscription, confirming plan change...');
        } else if (renewedSubscription) {
            // FTU is renewing their subscription
            // Send renewal email to the user
            console.log('FTU is renewing their subscription, sending renewal email...');
        }

        return billingRecord;
    }

    async deactivateSubscription(
        subscriptionData: BillingInsert,
        options: {
            reactivation?: boolean;
        },
    ) {
        // Triggered on subscription.cancelled or subscription.expired
        const { deactivated } = await billingQueries.deactivateSubscription(
            subscriptionData.userId,
            {
                productId: subscriptionData.productId!,
                subscriptionId: subscriptionData.subscriptionId!,
                customerId: subscriptionData.customerId!,
                provider: subscriptionData.provider!,
                webhookEvent: subscriptionData.webhookEvent!,
            },
        );

        if (!deactivated) {
            console.error('Subscription deactivation failed', subscriptionData);
            return;
        }

        if (options.reactivation) {
            // Send email notifying the user that their subscription has been put on hold and needs to be reactivated
            console.log('User subscription has been put on hold, sending email...');
        } else {
            // Send email notifying the user that their subscription has been deactivated
            console.log('User subscription has been deactivated, sending email...');
        }
    }

    async reactivateSubscription(subscriptionData: BillingInsert) {
        // Send an email notifying the user that their subscription has been put on hold and needs to be reactivated
        const updatedSubscription = await dodopayments.subscriptions.update(
            subscriptionData.subscriptionId!,
            {
                status: 'cancelled',
                metadata: {
                    reason: 'reactivation',
                },
            },
        );
    }

    async deferSubscription(subscriptionData: BillingInsert) {
        // Triggered on subscription.plan_changed
        // Notify the user acknowledging that plan change request has been received and would be in effect once the first payment is successful
        console.log(
            'User subscription plan change request has been received, sending email...',
            subscriptionData,
        );
    }

    async expireSubscription(subscriptionData: BillingInsert) {
        // Triggered on subscription.expired
        // Just send an email to the user notifying them that their subscription has expired

        const { deactivated } = await billingQueries.deactivateSubscription(
            subscriptionData.userId,
            {
                productId: subscriptionData.productId!,
                subscriptionId: subscriptionData.subscriptionId!,
                customerId: subscriptionData.customerId!,
                provider: subscriptionData.provider!,
                webhookEvent: subscriptionData.webhookEvent!,
            },
        );

        if (deactivated) {
            // Send email notifying the user that their subscription has been deactivated
            console.log('User subscription has expired, sending email...', subscriptionData);
        }
    }

    async processSubscription(userId: string, payload: SubscriptionWebhookPayload): Promise<void> {
        if (!payload.data.subscription_id) {
            throw new Error('Subscription ID is required');
        }

        if (!payload.data.customer.customer_id) {
            throw new Error('Customer ID is required');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!payload.data.product_id) {
            throw new Error('Product ID is required');
        }

        const currentPlan = getPlanFromProductId(payload.data.product_id);

        // Triggered on subscription.active, subscription.cancelled, subscription.expired, subscription.on_hold
        const subscriptionData: BillingInsert = {
            userId,

            // Entitlement info
            currentPlan,

            // Subscription info
            customerId: payload.data.customer.customer_id,
            subscriptionId: payload.data.subscription_id,
            productId: payload.data.product_id,

            // Provider info
            provider: 'dodo',
            webhookEvent: payload.type,
        };

        switch (payload.type) {
            // Subscription renewed
            case 'subscription.renewed':
                // We set the status to active to indicate that the user has access to the feature.
                await this.activateSubscription(subscriptionData);
                break;

            // Plan changed
            case 'subscription.plan_changed':
                // Acknowledge that plan change request has been received and would be in affect once the first payment is successful
                await this.deferSubscription(subscriptionData);
                break;

            // Subscription cancelled
            case 'subscription.cancelled':
                // We set the status to inactive to indicate that the user no longer has access to the feature. This is an explicit behavior with active user involvement hence we set the status to inactive right away.
                subscriptionData.status = 'inactive';
                await this.deactivateSubscription(subscriptionData, {
                    reactivation: payload.data.metadata?.reason == 'reactivation',
                });
                break;

            // Subscription expired
            case 'subscription.expired':
                // We set the status to grace to indicate that the user has access to the feature until the grace period ends. This is implicit behavior without active user involvement.
                subscriptionData.status = 'inactive';
                await this.expireSubscription(subscriptionData);
                break;

            // Subscription on hold
            case 'subscription.on_hold':
                // Acknowledge that subscription is on hold
                subscriptionData.status = 'inactive';
                await this.reactivateSubscription(subscriptionData);
                break;
        }
    }
}

export const billingService = BillingService.getInstance();
