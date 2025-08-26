import DisputeWebhook from './webhooks/dispute-webhook';
import LicenceWebhook from './webhooks/licence-webhook';
import PaymentWebhook from './webhooks/payment-webhook';
import RefundWebhook from './webhooks/refund-webhook';
import SubscriptionWebhook from './webhooks/subscription-webhook';

export type SubscriptionWebhookPayload = {
    type:
        | 'subscription.active'
        | 'subscription.on_hold'
        | 'subscription.renewed'
        | 'subscription.plan_changed'
        | 'subscription.cancelled'
        | 'subscription.failed'
        | 'subscription.expired';
    data: SubscriptionWebhook;
};

export type PaymentWebhookPayload = {
    type: 'payment.succeeded' | 'payment.failed' | 'payment.processing' | 'payment.cancelled';
    data: PaymentWebhook;
};

export type RefundWebhookPayload = {
    type: 'refund.succeeded' | 'refund.failed';
    data: RefundWebhook;
};

export type DisputeWebhookPayload = {
    type:
        | 'dispute.opened'
        | 'dispute.expired'
        | 'dispute.accepted'
        | 'dispute.cancelled'
        | 'dispute.challenged'
        | 'dispute.won'
        | 'dispute.lost';
    data: DisputeWebhook;
};

export type LicenceWebhookPayload = {
    type: 'license_key.created';
    data: LicenceWebhook;
};

type DodoWebhookPayload =
    | PaymentWebhookPayload
    | SubscriptionWebhookPayload
    | RefundWebhookPayload
    | DisputeWebhookPayload
    | LicenceWebhookPayload;

export default DodoWebhookPayload;
