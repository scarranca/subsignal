import { Context } from 'hono';
import { db } from '@/db';
import { webhook, webhookDelivery } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Available webhook events
 */
export const WEBHOOK_EVENTS = [
    // Contact events
    'contact.created',
    'contact.updated',
    'contact.deleted',
    // Company events
    'company.created',
    'company.updated',
    'company.deleted',
    // Deal events
    'deal.created',
    'deal.updated',
    'deal.stage_changed',
    'deal.won',
    'deal.lost',
    'deal.deleted',
    // Interaction events
    'interaction.created',
    'interaction.updated',
    // Task events
    'task.created',
    'task.completed',
    'task.updated',
    // Wildcard
    '*',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * Generate a secure webhook secret
 */
function generateWebhookSecret(): string {
    return `whsec_${crypto.randomBytes(24).toString('base64url')}`;
}

/**
 * Get all webhooks for current user
 */
export async function handleGetWebhooks(c: Context) {
    const userId = c.get('userId');

    const webhooks = await db
        .select({
            id: webhook.id,
            name: webhook.name,
            url: webhook.url,
            events: webhook.events,
            isActive: webhook.isActive,
            lastDeliveryAt: webhook.lastDeliveryAt,
            lastDeliveryStatus: webhook.lastDeliveryStatus,
            consecutiveFailures: webhook.consecutiveFailures,
            disabledAt: webhook.disabledAt,
            disabledReason: webhook.disabledReason,
            createdAt: webhook.createdAt,
        })
        .from(webhook)
        .where(eq(webhook.userId, userId))
        .orderBy(desc(webhook.createdAt));

    return c.json({ webhooks });
}

/**
 * Get single webhook with secret
 */
export async function handleGetWebhook(c: Context) {
    const userId = c.get('userId');
    const webhookId = c.req.param('id');

    const [record] = await db
        .select()
        .from(webhook)
        .where(and(eq(webhook.id, webhookId), eq(webhook.userId, userId)));

    if (!record) {
        return c.json({ error: 'Webhook not found' }, 404);
    }

    return c.json({ webhook: record });
}

/**
 * Create new webhook
 */
export async function handleCreateWebhook(c: Context) {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!body.name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    if (!body.url) {
        return c.json({ error: 'URL is required' }, 400);
    }

    // Validate URL
    try {
        new URL(body.url);
    } catch {
        return c.json({ error: 'Invalid URL' }, 400);
    }

    // Validate events
    const events = body.events || ['*'];
    const invalidEvents = events.filter((e: string) => !WEBHOOK_EVENTS.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
        return c.json({ error: `Invalid events: ${invalidEvents.join(', ')}` }, 400);
    }

    // Generate secret
    const secret = generateWebhookSecret();

    const [created] = await db
        .insert(webhook)
        .values({
            userId,
            name: body.name,
            url: body.url,
            secret,
            events,
            headers: body.headers || {},
            isActive: true,
        })
        .returning();

    // Return with secret (only shown once)
    return c.json({
        webhook: {
            id: created.id,
            name: created.name,
            url: created.url,
            secret, // Only shown on creation!
            events: created.events,
            isActive: created.isActive,
            createdAt: created.createdAt,
        },
        warning: 'Save this webhook secret now. You will not be able to see it again.',
    }, 201);
}

/**
 * Update webhook
 */
export async function handleUpdateWebhook(c: Context) {
    const userId = c.get('userId');
    const webhookId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
        .select()
        .from(webhook)
        .where(and(eq(webhook.id, webhookId), eq(webhook.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Webhook not found' }, 404);
    }

    const updateData: Partial<typeof webhook.$inferInsert> = { updatedAt: new Date() };

    if (body.name) updateData.name = body.name;
    if (body.url) {
        try {
            new URL(body.url);
            updateData.url = body.url;
        } catch {
            return c.json({ error: 'Invalid URL' }, 400);
        }
    }
    if (body.events) {
        const invalidEvents = body.events.filter((e: string) => !WEBHOOK_EVENTS.includes(e as WebhookEvent));
        if (invalidEvents.length > 0) {
            return c.json({ error: `Invalid events: ${invalidEvents.join(', ')}` }, 400);
        }
        updateData.events = body.events;
    }
    if (body.headers !== undefined) updateData.headers = body.headers;
    if (typeof body.isActive === 'boolean') {
        updateData.isActive = body.isActive;
        // If re-enabling, reset failure count
        if (body.isActive) {
            updateData.consecutiveFailures = 0;
            updateData.disabledAt = null;
            updateData.disabledReason = null;
        }
    }

    await db
        .update(webhook)
        .set(updateData)
        .where(eq(webhook.id, webhookId));

    const [updated] = await db
        .select({
            id: webhook.id,
            name: webhook.name,
            url: webhook.url,
            events: webhook.events,
            isActive: webhook.isActive,
            consecutiveFailures: webhook.consecutiveFailures,
            updatedAt: webhook.updatedAt,
        })
        .from(webhook)
        .where(eq(webhook.id, webhookId));

    return c.json({ webhook: updated });
}

/**
 * Delete webhook
 */
export async function handleDeleteWebhook(c: Context) {
    const userId = c.get('userId');
    const webhookId = c.req.param('id');

    const [existing] = await db
        .select()
        .from(webhook)
        .where(and(eq(webhook.id, webhookId), eq(webhook.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Webhook not found' }, 404);
    }

    // Delete deliveries first
    await db.delete(webhookDelivery).where(eq(webhookDelivery.webhookId, webhookId));

    // Delete webhook
    await db.delete(webhook).where(eq(webhook.id, webhookId));

    return c.json({ success: true });
}

/**
 * Regenerate webhook secret
 */
export async function handleRegenerateWebhookSecret(c: Context) {
    const userId = c.get('userId');
    const webhookId = c.req.param('id');

    const [existing] = await db
        .select()
        .from(webhook)
        .where(and(eq(webhook.id, webhookId), eq(webhook.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Webhook not found' }, 404);
    }

    const secret = generateWebhookSecret();

    await db
        .update(webhook)
        .set({ secret, updatedAt: new Date() })
        .where(eq(webhook.id, webhookId));

    return c.json({
        secret,
        warning: 'Save this webhook secret now. You will not be able to see it again.',
    });
}

/**
 * Test webhook by sending a test payload
 */
export async function handleTestWebhook(c: Context) {
    const userId = c.get('userId');
    const webhookId = c.req.param('id');

    const [wh] = await db
        .select()
        .from(webhook)
        .where(and(eq(webhook.id, webhookId), eq(webhook.userId, userId)));

    if (!wh) {
        return c.json({ error: 'Webhook not found' }, 404);
    }

    const startTime = Date.now();
    const timestamp = Date.now();
    const testPayload = {
        event: 'webhook.test',
        timestamp,
        data: {
            message: 'This is a test webhook delivery',
            webhookId: wh.id,
            webhookName: wh.name,
        },
    };

    const body = JSON.stringify(testPayload);

    // Create signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(wh.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const signature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    try {
        const response = await fetch(wh.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Timestamp': timestamp.toString(),
                ...(wh.headers as Record<string, string> || {}),
            },
            body,
        });

        const responseTime = Date.now() - startTime;
        const responseBody = await response.text().catch(() => '');

        // Log test delivery
        await db.insert(webhookDelivery).values({
            webhookId: wh.id,
            userId,
            eventType: 'webhook.test',
            payload: testPayload as any,
            statusCode: response.status,
            responseBody: responseBody.slice(0, 1000),
            responseTime,
            success: response.ok,
        });

        return c.json({
            success: response.ok,
            statusCode: response.status,
            responseTime,
            responseBody: responseBody.slice(0, 500),
        });
    } catch (error) {
        const responseTime = Date.now() - startTime;

        // Log failed delivery
        await db.insert(webhookDelivery).values({
            webhookId: wh.id,
            userId,
            eventType: 'webhook.test',
            payload: testPayload as any,
            responseTime,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reach endpoint',
            responseTime,
        });
    }
}

/**
 * Get webhook delivery history
 */
export async function handleGetWebhookDeliveries(c: Context) {
    const userId = c.get('userId');
    const webhookId = c.req.param('id');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

    const [wh] = await db
        .select()
        .from(webhook)
        .where(and(eq(webhook.id, webhookId), eq(webhook.userId, userId)));

    if (!wh) {
        return c.json({ error: 'Webhook not found' }, 404);
    }

    const deliveries = await db
        .select({
            id: webhookDelivery.id,
            eventType: webhookDelivery.eventType,
            statusCode: webhookDelivery.statusCode,
            responseTime: webhookDelivery.responseTime,
            success: webhookDelivery.success,
            error: webhookDelivery.error,
            attempt: webhookDelivery.attempt,
            createdAt: webhookDelivery.createdAt,
        })
        .from(webhookDelivery)
        .where(eq(webhookDelivery.webhookId, webhookId))
        .orderBy(desc(webhookDelivery.createdAt))
        .limit(limit);

    return c.json({ deliveries });
}

/**
 * Get available webhook events
 */
export async function handleGetWebhookEvents(c: Context) {
    const eventCategories = {
        contact: ['contact.created', 'contact.updated', 'contact.deleted'],
        company: ['company.created', 'company.updated', 'company.deleted'],
        deal: ['deal.created', 'deal.updated', 'deal.stage_changed', 'deal.won', 'deal.lost', 'deal.deleted'],
        interaction: ['interaction.created', 'interaction.updated'],
        task: ['task.created', 'task.completed', 'task.updated'],
        all: ['*'],
    };

    return c.json({ events: WEBHOOK_EVENTS, categories: eventCategories });
}
