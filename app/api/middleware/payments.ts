import { Context, Next } from 'hono';
import DodoWebhookPayload from '@/payments/types';
import { dodopaymentsWebhookHandler } from '@/payments/webhook';

// Dodo webhook types
export type WebhookPayload = DodoWebhookPayload;

export interface VerifiedWebhookContext {
    webhookPayload: WebhookPayload;
    webhookId: string;
    webhookTimestamp: string;
}

/**
 * Middleware to verify Dodo webhook signatures using DodoPaymentsWebhookHandler
 * Adds verified payload to context for use in handlers
 */
export async function verifyDodoWebhook(c: Context, next: Next) {
    try {
        const rawBody = await c.req.text();

        const payload = await dodopaymentsWebhookHandler.verify({
            body: rawBody,
            webhookId: c.req.header('webhook-id')!,
            webhookSignature: c.req.header('webhook-signature')!,
            webhookTimestamp: c.req.header('webhook-timestamp')!,
        });

        c.set('webhookPayload', payload);
        c.set('webhookId', c.req.header('webhook-id'));
        c.set('webhookTimestamp', c.req.header('webhook-timestamp'));

        await next();
    } catch (error) {
        console.error('dodopayments webhook verification error', error);
        return c.json(
            {
                success: false,
                error: 'Failed to verify incoming webhook',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            200,
        );
    }
}

/**
 * Type guard to check if context has verified webhook data
 */
export function hasVerifiedWebhook(c: Context): c is Context & {
    get(key: 'webhookPayload'): WebhookPayload;
    get(key: 'webhookId'): string;
    get(key: 'webhookTimestamp'): string;
} {
    const payload = c.get('webhookPayload');
    return !!(payload && c.get('webhookId') && isValidDodoWebhookPayload(payload));
}

/**
 * Type guard to check if payload is a valid Dodo webhook payload
 */
export function isValidDodoWebhookPayload(payload: unknown): payload is WebhookPayload {
    if (!payload || typeof payload !== 'object') return false;
    return !!(
        (payload as Record<string, unknown>).type && (payload as Record<string, unknown>).data
    );
}

/**
 * Helper to extract verified webhook data from context
 */
export function getWebhookData(c: Context): VerifiedWebhookContext | null {
    if (!hasVerifiedWebhook(c)) {
        return null;
    }

    return {
        webhookPayload: c.get('webhookPayload'),
        webhookId: c.get('webhookId'),
        webhookTimestamp: c.get('webhookTimestamp'),
    };
}
