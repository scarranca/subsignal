import { Webhook } from 'standardwebhooks';
import DodoWebhookPayload from './types';

export class DodoPaymentsWebhookHandler {
    private static instance: DodoPaymentsWebhookHandler | null = null;
    private webhook: Webhook;

    private constructor() {
        const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
        if (!webhookKey) {
            throw new Error('DODO_PAYMENTS_WEBHOOK_KEY environment variable is required');
        }
        this.webhook = new Webhook(webhookKey);
    }

    static getInstance(): DodoPaymentsWebhookHandler {
        if (!DodoPaymentsWebhookHandler.instance) {
            DodoPaymentsWebhookHandler.instance = new DodoPaymentsWebhookHandler();
        }
        return DodoPaymentsWebhookHandler.instance;
    }

    async verify({
        body,
        webhookId,
        webhookSignature,
        webhookTimestamp,
    }: {
        body: string;
        webhookId: string;
        webhookSignature: string;
        webhookTimestamp: string;
    }): Promise<DodoWebhookPayload> {
        if (!body) {
            const error = new Error('Missing body field!');
            error.name = 'dodopay_request_missing_data';
            throw error;
        }

        if (!webhookId || !webhookSignature || !webhookTimestamp) {
            const error = new Error('Missing key headers in the request!');
            error.name = 'dodopay_webhook_missing_headers';
            throw error;
        }

        try {
            const verifiedData = await this.webhook.verify(body, {
                'webhook-id': webhookId,
                'webhook-signature': webhookSignature,
                'webhook-timestamp': webhookTimestamp,
            });

            return verifiedData as DodoWebhookPayload;
        } catch (e) {
            if (e instanceof Error && e.name === 'WebhookVerificationError') {
                const error = new Error('Invalid signature!');
                error.name = 'dodopay_invalid_signature';
                throw error;
            }
            throw e;
        }
    }
}

/**
 * Singleton instance of the DodoPaymentsWebhookHandler
 */
export const dodopaymentsWebhookHandler = DodoPaymentsWebhookHandler.getInstance();

// /**
//  * Type-safe webhook utility functions using discriminated unions
//  */

// // Extract all webhook event types from the union
// type WebhookEventType = DodoWebhookPayload['type'];

// Extract specific webhook types by category
type PaymentWebhookTypes = Extract<DodoWebhookPayload, { type: `payment.${string}` }>['type'];
type SubscriptionWebhookTypes = Extract<
    DodoWebhookPayload,
    { type: `subscription.${string}` }
>['type'];
type RefundWebhookTypes = Extract<DodoWebhookPayload, { type: `refund.${string}` }>['type'];
type DisputeWebhookTypes = Extract<DodoWebhookPayload, { type: `dispute.${string}` }>['type'];
type LicenseWebhookTypes = Extract<DodoWebhookPayload, { type: `license_key.${string}` }>['type'];

// Type-safe webhook type mapping
type WebhookCategory = 'payment' | 'subscription' | 'refund' | 'dispute' | 'license';

// Create compile-time mapping from event types to categories
type WebhookTypeToCategory<T extends DodoWebhookPayload['type']> = T extends PaymentWebhookTypes
    ? 'payment'
    : T extends SubscriptionWebhookTypes
      ? 'subscription'
      : T extends RefundWebhookTypes
        ? 'refund'
        : T extends DisputeWebhookTypes
          ? 'dispute'
          : T extends LicenseWebhookTypes
            ? 'license'
            : never;

// Runtime type-safe sets for checking
const PAYMENT_WEBHOOK_TYPES = new Set<PaymentWebhookTypes>([
    'payment.succeeded',
    'payment.failed',
    'payment.processing',
    'payment.cancelled',
] as const);

const SUBSCRIPTION_WEBHOOK_TYPES = new Set<SubscriptionWebhookTypes>([
    'subscription.active',
    'subscription.on_hold',
    'subscription.renewed',
    'subscription.plan_changed',
    'subscription.cancelled',
    'subscription.failed',
    'subscription.expired',
] as const);

const REFUND_WEBHOOK_TYPES = new Set<RefundWebhookTypes>([
    'refund.succeeded',
    'refund.failed',
] as const);

const DISPUTE_WEBHOOK_TYPES = new Set<DisputeWebhookTypes>([
    'dispute.opened',
    'dispute.expired',
    'dispute.accepted',
    'dispute.cancelled',
    'dispute.challenged',
    'dispute.won',
    'dispute.lost',
] as const);

const LICENSE_WEBHOOK_TYPES = new Set<LicenseWebhookTypes>(['license_key.created'] as const);

export function getWebhookCategory<T extends DodoWebhookPayload>(
    payload: T,
): WebhookTypeToCategory<T['type']> {
    const eventType = payload.type;

    if (PAYMENT_WEBHOOK_TYPES.has(eventType as PaymentWebhookTypes)) {
        return 'payment' as WebhookTypeToCategory<T['type']>;
    }
    if (SUBSCRIPTION_WEBHOOK_TYPES.has(eventType as SubscriptionWebhookTypes)) {
        return 'subscription' as WebhookTypeToCategory<T['type']>;
    }
    if (REFUND_WEBHOOK_TYPES.has(eventType as RefundWebhookTypes)) {
        return 'refund' as WebhookTypeToCategory<T['type']>;
    }
    if (DISPUTE_WEBHOOK_TYPES.has(eventType as DisputeWebhookTypes)) {
        return 'dispute' as WebhookTypeToCategory<T['type']>;
    }
    if (LICENSE_WEBHOOK_TYPES.has(eventType as LicenseWebhookTypes)) {
        return 'license' as WebhookTypeToCategory<T['type']>;
    }

    // This should never happen with proper types, but needed for exhaustiveness
    throw new Error(`Unknown webhook type: ${eventType}`);
}

/**
 * Type guard to check if payload is a payment webhook
 */
export function isPaymentWebhook(
    payload: DodoWebhookPayload,
): payload is Extract<DodoWebhookPayload, { type: PaymentWebhookTypes }> {
    return PAYMENT_WEBHOOK_TYPES.has(payload.type as PaymentWebhookTypes);
}

/**
 * Type guard to check if payload is a subscription webhook
 */
export function isSubscriptionWebhook(
    payload: DodoWebhookPayload,
): payload is Extract<DodoWebhookPayload, { type: SubscriptionWebhookTypes }> {
    return SUBSCRIPTION_WEBHOOK_TYPES.has(payload.type as SubscriptionWebhookTypes);
}

/**
 * Type guard to check if payload is a refund webhook
 */
export function isRefundWebhook(
    payload: DodoWebhookPayload,
): payload is Extract<DodoWebhookPayload, { type: RefundWebhookTypes }> {
    return REFUND_WEBHOOK_TYPES.has(payload.type as RefundWebhookTypes);
}

/**
 * Type guard to check if payload is a dispute webhook
 */
export function isDisputeWebhook(
    payload: DodoWebhookPayload,
): payload is Extract<DodoWebhookPayload, { type: DisputeWebhookTypes }> {
    return DISPUTE_WEBHOOK_TYPES.has(payload.type as DisputeWebhookTypes);
}

/**
 * Type guard to check if payload is a license webhook
 */
export function isLicenseWebhook(
    payload: DodoWebhookPayload,
): payload is Extract<DodoWebhookPayload, { type: LicenseWebhookTypes }> {
    return LICENSE_WEBHOOK_TYPES.has(payload.type as LicenseWebhookTypes);
}

// Export types for external use
export type {
    PaymentWebhookTypes,
    SubscriptionWebhookTypes,
    RefundWebhookTypes,
    DisputeWebhookTypes,
    LicenseWebhookTypes,
    WebhookCategory,
};
