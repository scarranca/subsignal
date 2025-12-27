import { inngest } from '../client';
import { NonRetriableError } from 'inngest';
import { db } from '@/db';
import { integration, emailSync, calendarSync, contact, interaction } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { googleService } from '@/services/google';

/**
 * Sync Gmail messages for a user
 * Triggered manually or on schedule
 */
export const syncGmailMessages = inngest.createFunction(
    {
        id: 'sync-gmail-messages',
        retries: 3,
        throttle: {
            limit: 5,
            period: '1m',
        },
    },
    { event: 'integration/gmail.sync' },
    async ({ event, step }) => {
        const { integrationId, userId, fullSync } = event.data;

        // Get integration record
        const [integrationRecord] = await db
            .select()
            .from(integration)
            .where(eq(integration.id, integrationId));

        if (!integrationRecord || !integrationRecord.gmailEnabled) {
            throw new NonRetriableError('Gmail integration not enabled');
        }

        // Update sync status
        await db
            .update(integration)
            .set({ emailSyncStatus: 'syncing', updatedAt: new Date() })
            .where(eq(integration.id, integrationId));

        try {
            // Get valid access token
            const accessToken = await step.run('get-access-token', async () => {
                return googleService.getValidAccessToken(integrationId);
            });

            // Determine sync strategy
            const historyId = integrationRecord.gmailHistoryId;
            let newHistoryId: string | undefined;
            let processedCount = 0;

            if (historyId && !fullSync) {
                // Incremental sync using history API
                const result = await step.run('fetch-gmail-history', async () => {
                    return googleService.getGmailHistory(accessToken, historyId);
                });

                newHistoryId = result.historyId;

                // Process history changes
                for (const item of result.history) {
                    if (item.messagesAdded) {
                        for (const msg of item.messagesAdded) {
                            await step.run(`process-message-${msg.message.id}`, async () => {
                                return processGmailMessage(
                                    accessToken,
                                    msg.message.id,
                                    integrationId,
                                    userId
                                );
                            });
                            processedCount++;
                        }
                    }
                }
            } else {
                // Full sync - fetch recent messages
                const profile = await step.run('get-gmail-profile', async () => {
                    return googleService.getGmailProfile(accessToken);
                });

                newHistoryId = profile.historyId;

                // Fetch last 30 days of emails
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const result = await step.run('fetch-gmail-messages', async () => {
                    return googleService.fetchGmailMessages(accessToken, {
                        maxResults: 100,
                        after: thirtyDaysAgo,
                    });
                });

                // Process each message
                for (const message of result.messages) {
                    await step.run(`process-message-${message.id}`, async () => {
                        return processGmailMessage(accessToken, message.id, integrationId, userId, message);
                    });
                    processedCount++;
                }
            }

            // Update integration with new history ID and sync status
            await db
                .update(integration)
                .set({
                    gmailHistoryId: newHistoryId,
                    emailSyncStatus: 'success',
                    lastEmailSync: new Date(),
                    errorCount: 0,
                    lastError: null,
                    updatedAt: new Date(),
                })
                .where(eq(integration.id, integrationId));

            return { success: true, processedCount };
        } catch (error) {
            // Update error status
            await db
                .update(integration)
                .set({
                    emailSyncStatus: 'error',
                    lastError: error instanceof Error ? error.message : 'Unknown error',
                    lastErrorAt: new Date(),
                    errorCount: (integrationRecord.errorCount || 0) + 1,
                    updatedAt: new Date(),
                })
                .where(eq(integration.id, integrationId));

            throw error;
        }
    }
);

/**
 * Sync Google Calendar events for a user
 */
export const syncCalendarEvents = inngest.createFunction(
    {
        id: 'sync-calendar-events',
        retries: 3,
        throttle: {
            limit: 5,
            period: '1m',
        },
    },
    { event: 'integration/calendar.sync' },
    async ({ event, step }) => {
        const { integrationId, userId, fullSync } = event.data;

        // Get integration record
        const [integrationRecord] = await db
            .select()
            .from(integration)
            .where(eq(integration.id, integrationId));

        if (!integrationRecord || !integrationRecord.calendarEnabled) {
            throw new NonRetriableError('Calendar integration not enabled');
        }

        // Update sync status
        await db
            .update(integration)
            .set({ calendarSyncStatus: 'syncing', updatedAt: new Date() })
            .where(eq(integration.id, integrationId));

        try {
            // Get valid access token
            const accessToken = await step.run('get-access-token', async () => {
                return googleService.getValidAccessToken(integrationId);
            });

            // Determine sync strategy
            const syncToken = integrationRecord.calendarSyncToken;
            let processedCount = 0;
            let newSyncToken: string | undefined;

            if (syncToken && !fullSync) {
                // Incremental sync using sync token
                const result = await step.run('fetch-calendar-incremental', async () => {
                    return googleService.fetchCalendarEvents(accessToken, {
                        syncToken,
                    });
                });

                newSyncToken = result.nextSyncToken;

                for (const event of result.events) {
                    await step.run(`process-event-${event.id}`, async () => {
                        return processCalendarEvent(event, integrationId, userId);
                    });
                    processedCount++;
                }
            } else {
                // Full sync - fetch events from past month to next 3 months
                const timeMin = new Date();
                timeMin.setMonth(timeMin.getMonth() - 1);

                const timeMax = new Date();
                timeMax.setMonth(timeMax.getMonth() + 3);

                const result = await step.run('fetch-calendar-full', async () => {
                    return googleService.fetchCalendarEvents(accessToken, {
                        timeMin,
                        timeMax,
                        maxResults: 250,
                    });
                });

                newSyncToken = result.nextSyncToken;

                for (const event of result.events) {
                    await step.run(`process-event-${event.id}`, async () => {
                        return processCalendarEvent(event, integrationId, userId);
                    });
                    processedCount++;
                }
            }

            // Update integration with new sync token
            await db
                .update(integration)
                .set({
                    calendarSyncToken: newSyncToken,
                    calendarSyncStatus: 'success',
                    lastCalendarSync: new Date(),
                    errorCount: 0,
                    lastError: null,
                    updatedAt: new Date(),
                })
                .where(eq(integration.id, integrationId));

            return { success: true, processedCount };
        } catch (error) {
            // Update error status
            await db
                .update(integration)
                .set({
                    calendarSyncStatus: 'error',
                    lastError: error instanceof Error ? error.message : 'Unknown error',
                    lastErrorAt: new Date(),
                    errorCount: (integrationRecord.errorCount || 0) + 1,
                    updatedAt: new Date(),
                })
                .where(eq(integration.id, integrationId));

            throw error;
        }
    }
);

/**
 * Scheduled Gmail sync - runs every 15 minutes
 */
export const scheduledGmailSync = inngest.createFunction(
    {
        id: 'scheduled-gmail-sync',
    },
    { cron: '*/15 * * * *' }, // Every 15 minutes
    async ({ step }) => {
        // Get all integrations with Gmail enabled
        const integrations = await step.run('get-integrations', async () => {
            return db
                .select()
                .from(integration)
                .where(
                    and(
                        eq(integration.gmailEnabled, true),
                        eq(integration.syncEmails, true)
                    )
                );
        });

        // Trigger sync for each integration
        const events = integrations.map((int) => ({
            name: 'integration/gmail.sync' as const,
            data: {
                integrationId: int.id,
                userId: int.userId,
                fullSync: false,
            },
        }));

        if (events.length > 0) {
            await step.sendEvent('trigger-syncs', events);
        }

        return { triggered: events.length };
    }
);

/**
 * Scheduled Calendar sync - runs every 30 minutes
 */
export const scheduledCalendarSync = inngest.createFunction(
    {
        id: 'scheduled-calendar-sync',
    },
    { cron: '*/30 * * * *' }, // Every 30 minutes
    async ({ step }) => {
        // Get all integrations with Calendar enabled
        const integrations = await step.run('get-integrations', async () => {
            return db
                .select()
                .from(integration)
                .where(
                    and(
                        eq(integration.calendarEnabled, true),
                        eq(integration.syncCalendar, true)
                    )
                );
        });

        // Trigger sync for each integration
        const events = integrations.map((int) => ({
            name: 'integration/calendar.sync' as const,
            data: {
                integrationId: int.id,
                userId: int.userId,
                fullSync: false,
            },
        }));

        if (events.length > 0) {
            await step.sendEvent('trigger-syncs', events);
        }

        return { triggered: events.length };
    }
);

/**
 * Process a single Gmail message
 */
async function processGmailMessage(
    accessToken: string,
    messageId: string,
    integrationId: string,
    userId: string,
    existingMessage?: any
): Promise<void> {
    // Check if already synced
    const [existing] = await db
        .select()
        .from(emailSync)
        .where(
            and(
                eq(emailSync.integrationId, integrationId),
                eq(emailSync.messageId, messageId)
            )
        );

    if (existing) {
        return; // Already processed
    }

    // Fetch full message if not provided
    let message = existingMessage;
    if (!message || !message.payload) {
        const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        message = await response.json();
    }

    // Parse headers
    const headers = googleService.parseEmailHeaders(message.payload.headers);
    const body = googleService.extractEmailBody(message);

    // Try to match with existing contact
    let contactId: string | null = null;
    const [matchedContact] = await db
        .select()
        .from(contact)
        .where(
            and(
                eq(contact.userId, userId),
                eq(contact.email, headers.from.email)
            )
        );

    if (matchedContact) {
        contactId = matchedContact.id;
    }

    // Store in email sync table
    await db.insert(emailSync).values({
        integrationId,
        userId,
        messageId,
        threadId: message.threadId,
        subject: headers.subject,
        fromEmail: headers.from.email,
        fromName: headers.from.name,
        toEmails: headers.to,
        ccEmails: headers.cc,
        snippet: message.snippet,
        bodyText: body.text,
        bodyHtml: body.html,
        emailDate: headers.date,
        receivedAt: new Date(parseInt(message.internalDate)),
        contactId,
        labels: message.labelIds,
        processed: false,
    });

    // If matched to a contact, create an interaction
    if (contactId) {
        await db.insert(interaction).values({
            userId,
            contactId,
            companyId: matchedContact?.companyId || null,
            type: 'email',
            direction: 'inbound',
            subject: headers.subject,
            notes: body.text?.slice(0, 500) || message.snippet,
            occurredAt: headers.date,
            metadata: {
                gmailMessageId: messageId,
                gmailThreadId: message.threadId,
            },
        });

        // Mark as processed
        await db
            .update(emailSync)
            .set({ processed: true, processedAt: new Date() })
            .where(
                and(
                    eq(emailSync.integrationId, integrationId),
                    eq(emailSync.messageId, messageId)
                )
            );
    }
}

/**
 * Process a single calendar event
 */
async function processCalendarEvent(
    event: any,
    integrationId: string,
    userId: string
): Promise<void> {
    // Check if already synced
    const [existing] = await db
        .select()
        .from(calendarSync)
        .where(
            and(
                eq(calendarSync.integrationId, integrationId),
                eq(calendarSync.eventId, event.id)
            )
        );

    const startTime = event.start.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start.date);

    const endTime = event.end.dateTime
        ? new Date(event.end.dateTime)
        : new Date(event.end.date);

    const isAllDay = !event.start.dateTime;

    // Extract meeting link
    let meetingLink = event.hangoutLink;
    let conferenceType = meetingLink ? 'google_meet' : undefined;

    if (event.conferenceData?.entryPoints) {
        for (const entry of event.conferenceData.entryPoints) {
            if (entry.entryPointType === 'video') {
                meetingLink = entry.uri;
                if (entry.uri?.includes('zoom')) conferenceType = 'zoom';
                else if (entry.uri?.includes('teams')) conferenceType = 'teams';
                break;
            }
        }
    }

    const calendarData = {
        integrationId,
        userId,
        eventId: event.id,
        calendarId: 'primary',
        summary: event.summary,
        description: event.description,
        location: event.location,
        startTime,
        endTime,
        isAllDay,
        timezone: event.start.timeZone,
        attendees: event.attendees?.map((a: any) => ({
            email: a.email,
            name: a.displayName,
            responseStatus: a.responseStatus,
        })),
        organizerEmail: event.organizer?.email,
        meetingLink,
        conferenceType,
        status: event.status,
        etag: event.etag,
        lastUpdatedExternal: event.updated ? new Date(event.updated) : undefined,
        updatedAt: new Date(),
    };

    if (existing) {
        // Update existing record
        await db
            .update(calendarSync)
            .set(calendarData)
            .where(eq(calendarSync.id, existing.id));
    } else {
        // Insert new record
        await db.insert(calendarSync).values({
            ...calendarData,
            processed: false,
        });
    }

    // Try to match attendees with contacts and create interactions
    if (event.attendees?.length) {
        for (const attendee of event.attendees) {
            const [matchedContact] = await db
                .select()
                .from(contact)
                .where(
                    and(
                        eq(contact.userId, userId),
                        eq(contact.email, attendee.email)
                    )
                );

            if (matchedContact) {
                // Check if interaction already exists for this event
                const existingInteractions = await db
                    .select()
                    .from(interaction)
                    .where(
                        and(
                            eq(interaction.userId, userId),
                            eq(interaction.contactId, matchedContact.id)
                        )
                    );

                const hasInteraction = existingInteractions.some(
                    (i) => (i.metadata as any)?.calendarEventId === event.id
                );

                if (!hasInteraction) {
                    await db.insert(interaction).values({
                        userId,
                        contactId: matchedContact.id,
                        companyId: matchedContact.companyId,
                        type: 'meeting',
                        direction: 'outbound',
                        subject: event.summary,
                        notes: event.description?.slice(0, 500),
                        occurredAt: startTime,
                        durationMinutes: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
                        metadata: {
                            calendarEventId: event.id,
                            meetingLink,
                            location: event.location,
                        },
                    });
                }

                // Update calendar sync as processed
                await db
                    .update(calendarSync)
                    .set({
                        processed: true,
                        processedAt: new Date(),
                        contactId: matchedContact.id,
                    })
                    .where(
                        and(
                            eq(calendarSync.integrationId, integrationId),
                            eq(calendarSync.eventId, event.id)
                        )
                    );
            }
        }
    }
}
