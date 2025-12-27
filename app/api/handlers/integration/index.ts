import { Context } from 'hono';
import { db } from '@/db';
import { integration, emailSync, calendarSync } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { googleService } from '@/services/google';
import { inngest } from '@/ingest/client';
import { GOOGLE_CRM_SCOPES } from '@/lib/auth';
import { getUser } from '@/app/api/middleware/auth';

/**
 * Get all integrations for current user
 */
export async function handleGetIntegrations(c: Context) {
    const userId = getUser(c).id;

    const integrations = await db
        .select()
        .from(integration)
        .where(eq(integration.userId, userId))
        .orderBy(desc(integration.createdAt));

    return c.json({ integrations });
}

/**
 * Get specific integration
 */
export async function handleGetIntegration(c: Context) {
    const userId = getUser(c).id;
    const integrationId = c.req.param('id');

    const [record] = await db
        .select()
        .from(integration)
        .where(and(eq(integration.id, integrationId), eq(integration.userId, userId)));

    if (!record) {
        return c.json({ error: 'Integration not found' }, 404);
    }

    return c.json({ integration: record });
}

/**
 * Get Google OAuth URL for connecting Gmail/Calendar
 */
export async function handleGetGoogleAuthUrl(c: Context) {
    const userId = getUser(c).id;

    // Create a state parameter with user info
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64url');

    const authUrl = googleService.getAuthUrl(state);

    return c.json({ authUrl });
}

/**
 * Handle Google OAuth callback
 */
export async function handleGoogleCallback(c: Context) {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
        // Redirect to settings with error
        return c.redirect(`/settings/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return c.redirect('/settings/integrations?error=missing_params');
    }

    try {
        // Decode state
        const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
        const { userId } = stateData;

        // Exchange code for tokens
        const tokens = await googleService.exchangeCodeForTokens(code);

        // Check if integration already exists
        const [existing] = await db
            .select()
            .from(integration)
            .where(
                and(
                    eq(integration.userId, userId),
                    eq(integration.provider, 'google'),
                    eq(integration.connectedEmail, tokens.email)
                )
            );

        if (existing) {
            // Update existing integration
            await db
                .update(integration)
                .set({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    tokenExpiresAt: tokens.expiresAt,
                    gmailEnabled: true,
                    calendarEnabled: true,
                    updatedAt: new Date(),
                })
                .where(eq(integration.id, existing.id));
        } else {
            // Create new integration
            await db.insert(integration).values({
                userId,
                provider: 'google',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenExpiresAt: tokens.expiresAt,
                connectedEmail: tokens.email,
                connectedName: tokens.name,
                gmailEnabled: true,
                calendarEnabled: true,
            });
        }

        // Get the integration ID for triggering sync
        const [newIntegration] = await db
            .select()
            .from(integration)
            .where(
                and(
                    eq(integration.userId, userId),
                    eq(integration.provider, 'google'),
                    eq(integration.connectedEmail, tokens.email)
                )
            );

        // Trigger initial sync
        if (newIntegration) {
            await inngest.send([
                {
                    name: 'integration/gmail.sync',
                    data: { integrationId: newIntegration.id, userId, fullSync: true },
                },
                {
                    name: 'integration/calendar.sync',
                    data: { integrationId: newIntegration.id, userId, fullSync: true },
                },
            ]);
        }

        return c.redirect('/settings/integrations?success=google_connected');
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return c.redirect('/settings/integrations?error=oauth_failed');
    }
}

/**
 * Update integration settings
 */
export async function handleUpdateIntegration(c: Context) {
    const userId = getUser(c).id;
    const integrationId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
        .select()
        .from(integration)
        .where(and(eq(integration.id, integrationId), eq(integration.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Integration not found' }, 404);
    }

    const updateData: Partial<typeof integration.$inferInsert> = {};

    if (typeof body.gmailEnabled === 'boolean') updateData.gmailEnabled = body.gmailEnabled;
    if (typeof body.calendarEnabled === 'boolean') updateData.calendarEnabled = body.calendarEnabled;
    if (typeof body.syncEmails === 'boolean') updateData.syncEmails = body.syncEmails;
    if (typeof body.syncCalendar === 'boolean') updateData.syncCalendar = body.syncCalendar;
    if (typeof body.syncContactsFromEmail === 'boolean') updateData.syncContactsFromEmail = body.syncContactsFromEmail;

    updateData.updatedAt = new Date();

    await db
        .update(integration)
        .set(updateData)
        .where(eq(integration.id, integrationId));

    const [updated] = await db
        .select()
        .from(integration)
        .where(eq(integration.id, integrationId));

    return c.json({ integration: updated });
}

/**
 * Disconnect integration
 */
export async function handleDisconnectIntegration(c: Context) {
    const userId = getUser(c).id;
    const integrationId = c.req.param('id');

    const [existing] = await db
        .select()
        .from(integration)
        .where(and(eq(integration.id, integrationId), eq(integration.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Integration not found' }, 404);
    }

    // Delete related sync records first
    await db.delete(emailSync).where(eq(emailSync.integrationId, integrationId));
    await db.delete(calendarSync).where(eq(calendarSync.integrationId, integrationId));

    // Delete integration
    await db.delete(integration).where(eq(integration.id, integrationId));

    return c.json({ success: true });
}

/**
 * Trigger manual sync
 */
export async function handleTriggerSync(c: Context) {
    const userId = getUser(c).id;
    const integrationId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
        .select()
        .from(integration)
        .where(and(eq(integration.id, integrationId), eq(integration.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Integration not found' }, 404);
    }

    const events: any[] = [];

    if (body.type === 'gmail' || body.type === 'all') {
        if (existing.gmailEnabled) {
            events.push({
                name: 'integration/gmail.sync',
                data: { integrationId, userId, fullSync: body.fullSync || false },
            });
        }
    }

    if (body.type === 'calendar' || body.type === 'all') {
        if (existing.calendarEnabled) {
            events.push({
                name: 'integration/calendar.sync',
                data: { integrationId, userId, fullSync: body.fullSync || false },
            });
        }
    }

    if (events.length > 0) {
        await inngest.send(events);
    }

    return c.json({ success: true, triggered: events.length });
}

/**
 * Get sync status and stats
 */
export async function handleGetSyncStatus(c: Context) {
    const userId = getUser(c).id;
    const integrationId = c.req.param('id');

    const [record] = await db
        .select()
        .from(integration)
        .where(and(eq(integration.id, integrationId), eq(integration.userId, userId)));

    if (!record) {
        return c.json({ error: 'Integration not found' }, 404);
    }

    // Get sync stats
    const emailCount = await db
        .select()
        .from(emailSync)
        .where(eq(emailSync.integrationId, integrationId));

    const calendarCount = await db
        .select()
        .from(calendarSync)
        .where(eq(calendarSync.integrationId, integrationId));

    return c.json({
        integration: {
            id: record.id,
            provider: record.provider,
            connectedEmail: record.connectedEmail,
            gmailEnabled: record.gmailEnabled,
            calendarEnabled: record.calendarEnabled,
        },
        gmail: {
            status: record.emailSyncStatus,
            lastSync: record.lastEmailSync,
            syncedCount: emailCount.length,
            error: record.emailSyncStatus === 'error' ? record.lastError : null,
        },
        calendar: {
            status: record.calendarSyncStatus,
            lastSync: record.lastCalendarSync,
            syncedCount: calendarCount.length,
            error: record.calendarSyncStatus === 'error' ? record.lastError : null,
        },
    });
}

/**
 * Send email via Gmail integration
 */
export async function handleSendEmail(c: Context) {
    const userId = getUser(c).id;
    const integrationId = c.req.param('id');
    const body = await c.req.json();

    const [record] = await db
        .select()
        .from(integration)
        .where(
            and(
                eq(integration.id, integrationId),
                eq(integration.userId, userId),
                eq(integration.gmailEnabled, true)
            )
        );

    if (!record) {
        return c.json({ error: 'Gmail integration not found or not enabled' }, 404);
    }

    try {
        const accessToken = await googleService.getValidAccessToken(integrationId);

        const result = await googleService.sendEmail(accessToken, {
            to: body.to,
            subject: body.subject,
            body: body.body,
            cc: body.cc,
            bcc: body.bcc,
            threadId: body.threadId,
        });

        return c.json({ success: true, messageId: result.id, threadId: result.threadId });
    } catch (err) {
        console.error('Send email error:', err);
        return c.json({ error: 'Failed to send email' }, 500);
    }
}

/**
 * Create calendar event via Google Calendar integration
 */
export async function handleCreateCalendarEvent(c: Context) {
    const userId = getUser(c).id;
    const integrationId = c.req.param('id');
    const body = await c.req.json();

    const [record] = await db
        .select()
        .from(integration)
        .where(
            and(
                eq(integration.id, integrationId),
                eq(integration.userId, userId),
                eq(integration.calendarEnabled, true)
            )
        );

    if (!record) {
        return c.json({ error: 'Calendar integration not found or not enabled' }, 404);
    }

    try {
        const accessToken = await googleService.getValidAccessToken(integrationId);

        const result = await googleService.createCalendarEvent(accessToken, {
            summary: body.summary,
            description: body.description,
            location: body.location,
            start: body.start,
            end: body.end,
            attendees: body.attendees,
        });

        return c.json({ success: true, event: result });
    } catch (err) {
        console.error('Create calendar event error:', err);
        return c.json({ error: 'Failed to create calendar event' }, 500);
    }
}
