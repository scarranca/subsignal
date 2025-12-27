import { inngest } from '../client';
import { NonRetriableError } from 'inngest';
import { db } from '@/db';
import { deal, contact, company, user, webhook, webhookDelivery } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { emailService } from '@/services/email';

/**
 * Deal event types
 */
export type DealEventType =
    | 'deal.created'
    | 'deal.updated'
    | 'deal.stage_changed'
    | 'deal.won'
    | 'deal.lost'
    | 'deal.reopened';

/**
 * Send notification when a deal is created
 */
export const sendDealCreatedNotification = inngest.createFunction(
    {
        id: 'deal-created-notification',
        throttle: { limit: 10, period: '1s' },
    },
    { event: 'crm/deal.created' },
    async ({ event, step }) => {
        const { dealId, userId } = event.data;

        const dealData = await step.run('get-deal-data', async () => {
            const [dealRecord] = await db
                .select()
                .from(deal)
                .where(eq(deal.id, dealId));

            if (!dealRecord) return null;

            const [contactRecord] = dealRecord.contactId
                ? await db.select().from(contact).where(eq(contact.id, dealRecord.contactId))
                : [null];

            const [companyRecord] = dealRecord.companyId
                ? await db.select().from(company).where(eq(company.id, dealRecord.companyId))
                : [null];

            const [userRecord] = await db.select().from(user).where(eq(user.id, userId));

            return { deal: dealRecord, contact: contactRecord, company: companyRecord, user: userRecord };
        });

        if (!dealData?.deal || !dealData?.user) {
            throw new NonRetriableError('Deal or user not found');
        }

        // Send email notification to deal owner
        await step.run('send-email', async () => {
            await emailService.sendDealNotification({
                email: dealData.user!.email,
                userName: dealData.user!.name,
                dealName: dealData.deal.name,
                dealValue: dealData.deal.value,
                currency: dealData.deal.currency || 'USD',
                contactName: dealData.contact
                    ? `${dealData.contact.firstName || ''} ${dealData.contact.lastName || ''}`.trim()
                    : undefined,
                companyName: dealData.company?.name,
                eventType: 'created',
            });
        });

        // Trigger webhooks
        await step.sendEvent('trigger-webhooks', {
            name: 'crm/webhook.trigger',
            data: {
                userId,
                eventType: 'deal.created',
                payload: {
                    deal: dealData.deal,
                    contact: dealData.contact,
                    company: dealData.company,
                },
            },
        });
    }
);

/**
 * Send notification when a deal stage changes
 */
export const sendDealStageChangedNotification = inngest.createFunction(
    {
        id: 'deal-stage-changed-notification',
        throttle: { limit: 10, period: '1s' },
    },
    { event: 'crm/deal.stage_changed' },
    async ({ event, step }) => {
        const { dealId, userId, previousStage, newStage, previousStageName, newStageName } = event.data;

        const dealData = await step.run('get-deal-data', async () => {
            const [dealRecord] = await db.select().from(deal).where(eq(deal.id, dealId));
            if (!dealRecord) return null;

            const [userRecord] = await db.select().from(user).where(eq(user.id, userId));
            const [contactRecord] = dealRecord.contactId
                ? await db.select().from(contact).where(eq(contact.id, dealRecord.contactId))
                : [null];

            return { deal: dealRecord, user: userRecord, contact: contactRecord };
        });

        if (!dealData?.deal || !dealData?.user) {
            throw new NonRetriableError('Deal or user not found');
        }

        // Send email notification
        await step.run('send-email', async () => {
            await emailService.sendDealStageChangeNotification({
                email: dealData.user!.email,
                userName: dealData.user!.name,
                dealName: dealData.deal.name,
                dealValue: dealData.deal.value,
                currency: dealData.deal.currency || 'USD',
                previousStage: previousStageName,
                newStage: newStageName,
            });
        });

        // Trigger webhooks
        await step.sendEvent('trigger-webhooks', {
            name: 'crm/webhook.trigger',
            data: {
                userId,
                eventType: 'deal.stage_changed',
                payload: {
                    deal: dealData.deal,
                    previousStage,
                    newStage,
                    previousStageName,
                    newStageName,
                },
            },
        });
    }
);

/**
 * Send notification when a deal is won
 */
export const sendDealWonNotification = inngest.createFunction(
    {
        id: 'deal-won-notification',
        throttle: { limit: 10, period: '1s' },
    },
    { event: 'crm/deal.won' },
    async ({ event, step }) => {
        const { dealId, userId } = event.data;

        const dealData = await step.run('get-deal-data', async () => {
            const [dealRecord] = await db.select().from(deal).where(eq(deal.id, dealId));
            if (!dealRecord) return null;

            const [userRecord] = await db.select().from(user).where(eq(user.id, userId));
            const [contactRecord] = dealRecord.contactId
                ? await db.select().from(contact).where(eq(contact.id, dealRecord.contactId))
                : [null];
            const [companyRecord] = dealRecord.companyId
                ? await db.select().from(company).where(eq(company.id, dealRecord.companyId))
                : [null];

            return { deal: dealRecord, user: userRecord, contact: contactRecord, company: companyRecord };
        });

        if (!dealData?.deal || !dealData?.user) {
            throw new NonRetriableError('Deal or user not found');
        }

        // Send celebratory email
        await step.run('send-email', async () => {
            await emailService.sendDealWonNotification({
                email: dealData.user!.email,
                userName: dealData.user!.name,
                dealName: dealData.deal.name,
                dealValue: dealData.deal.value,
                currency: dealData.deal.currency || 'USD',
                contactName: dealData.contact
                    ? `${dealData.contact.firstName || ''} ${dealData.contact.lastName || ''}`.trim()
                    : undefined,
                companyName: dealData.company?.name,
            });
        });

        // Trigger webhooks
        await step.sendEvent('trigger-webhooks', {
            name: 'crm/webhook.trigger',
            data: {
                userId,
                eventType: 'deal.won',
                payload: {
                    deal: dealData.deal,
                    contact: dealData.contact,
                    company: dealData.company,
                },
            },
        });
    }
);

/**
 * Send notification when a deal is lost
 */
export const sendDealLostNotification = inngest.createFunction(
    {
        id: 'deal-lost-notification',
        throttle: { limit: 10, period: '1s' },
    },
    { event: 'crm/deal.lost' },
    async ({ event, step }) => {
        const { dealId, userId, lostReason } = event.data;

        const dealData = await step.run('get-deal-data', async () => {
            const [dealRecord] = await db.select().from(deal).where(eq(deal.id, dealId));
            if (!dealRecord) return null;

            const [userRecord] = await db.select().from(user).where(eq(user.id, userId));

            return { deal: dealRecord, user: userRecord };
        });

        if (!dealData?.deal || !dealData?.user) {
            throw new NonRetriableError('Deal or user not found');
        }

        // Send email notification
        await step.run('send-email', async () => {
            await emailService.sendDealLostNotification({
                email: dealData.user!.email,
                userName: dealData.user!.name,
                dealName: dealData.deal.name,
                dealValue: dealData.deal.value,
                currency: dealData.deal.currency || 'USD',
                lostReason: lostReason || dealData.deal.lostReason,
            });
        });

        // Trigger webhooks
        await step.sendEvent('trigger-webhooks', {
            name: 'crm/webhook.trigger',
            data: {
                userId,
                eventType: 'deal.lost',
                payload: {
                    deal: dealData.deal,
                    lostReason: lostReason || dealData.deal.lostReason,
                },
            },
        });
    }
);

/**
 * Trigger webhooks for CRM events
 */
export const triggerWebhooks = inngest.createFunction(
    {
        id: 'trigger-webhooks',
        retries: 3,
    },
    { event: 'crm/webhook.trigger' },
    async ({ event, step }) => {
        const { userId, eventType, payload } = event.data;

        // Get active webhooks for this user and event type
        const webhooks = await step.run('get-webhooks', async () => {
            return db
                .select()
                .from(webhook)
                .where(
                    and(
                        eq(webhook.userId, userId),
                        eq(webhook.isActive, true)
                    )
                );
        });

        // Filter webhooks that listen to this event
        const relevantWebhooks = webhooks.filter((wh) => {
            const events = wh.events as string[];
            return events.includes(eventType) || events.includes('*');
        });

        // Send to each webhook
        for (const wh of relevantWebhooks) {
            await step.run(`send-webhook-${wh.id}`, async () => {
                const startTime = Date.now();
                let success = false;
                let statusCode: number | undefined;
                let responseBody: string | undefined;
                let error: string | undefined;

                try {
                    // Create signature
                    const timestamp = Date.now();
                    const body = JSON.stringify({
                        event: eventType,
                        timestamp,
                        data: payload,
                    });

                    const signature = await createWebhookSignature(body, wh.secret);

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

                    statusCode = response.status;
                    responseBody = await response.text().catch(() => '');
                    success = response.ok;

                    // Update webhook status
                    await db
                        .update(webhook)
                        .set({
                            lastDeliveryAt: new Date(),
                            lastDeliveryStatus: success ? 'success' : 'failed',
                            consecutiveFailures: success ? 0 : (wh.consecutiveFailures || 0) + 1,
                            updatedAt: new Date(),
                        })
                        .where(eq(webhook.id, wh.id));

                    // Disable webhook after 5 consecutive failures
                    if (!success && (wh.consecutiveFailures || 0) >= 4) {
                        await db
                            .update(webhook)
                            .set({
                                isActive: false,
                                disabledAt: new Date(),
                                disabledReason: 'Too many consecutive failures',
                            })
                            .where(eq(webhook.id, wh.id));
                    }
                } catch (err) {
                    error = err instanceof Error ? err.message : 'Unknown error';
                    success = false;
                }

                // Log delivery
                await db.insert(webhookDelivery).values({
                    webhookId: wh.id,
                    userId,
                    eventType,
                    payload: payload as any,
                    statusCode,
                    responseBody: responseBody?.slice(0, 1000),
                    responseTime: Date.now() - startTime,
                    success,
                    error,
                });
            });
        }

        return { triggered: relevantWebhooks.length };
    }
);

/**
 * Create HMAC signature for webhook
 */
async function createWebhookSignature(body: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
