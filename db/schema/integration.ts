import { pgTable, text, timestamp, boolean, jsonb, index, pgEnum, integer } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Integration provider types
 */
export const integrationProviderEnum = pgEnum('integration_provider', [
    'google',
    'microsoft',
    'slack',
    'hubspot',
    'salesforce',
]);

export type IntegrationProvider = (typeof integrationProviderEnum.enumValues)[number];

/**
 * Sync status types
 */
export const syncStatusEnum = pgEnum('sync_status', [
    'idle',
    'syncing',
    'success',
    'error',
    'paused',
]);

export type SyncStatus = (typeof syncStatusEnum.enumValues)[number];

/**
 * Integration settings table
 * Stores OAuth connections and sync preferences for each user
 */
export const integration = pgTable(
    'integration',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        provider: integrationProviderEnum('provider').notNull(),

        // OAuth tokens
        accountId: text('account_id'), // Reference to better-auth account
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        tokenExpiresAt: timestamp('token_expires_at'),

        // Connected email/account info
        connectedEmail: text('connected_email'),
        connectedName: text('connected_name'),

        // Feature flags
        gmailEnabled: boolean('gmail_enabled').default(false).notNull(),
        calendarEnabled: boolean('calendar_enabled').default(false).notNull(),

        // Sync settings
        syncEmails: boolean('sync_emails').default(true).notNull(),
        syncCalendar: boolean('sync_calendar').default(true).notNull(),
        syncContactsFromEmail: boolean('sync_contacts_from_email').default(false).notNull(),

        // Last sync timestamps
        lastEmailSync: timestamp('last_email_sync'),
        lastCalendarSync: timestamp('last_calendar_sync'),

        // Sync status
        emailSyncStatus: syncStatusEnum('email_sync_status').default('idle').notNull(),
        calendarSyncStatus: syncStatusEnum('calendar_sync_status').default('idle').notNull(),

        // Sync cursors/history IDs for incremental sync
        gmailHistoryId: text('gmail_history_id'),
        calendarSyncToken: text('calendar_sync_token'),

        // Error tracking
        lastError: text('last_error'),
        lastErrorAt: timestamp('last_error_at'),
        errorCount: integer('error_count').default(0).notNull(),

        // Metadata
        settings: jsonb('settings').$type<Record<string, unknown>>(),

        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('integration_user_id_idx').on(table.userId),
        index('integration_provider_idx').on(table.provider),
        index('integration_user_provider_idx').on(table.userId, table.provider),
    ],
);

/**
 * Email sync log
 * Tracks synced emails to avoid duplicates and enable delta sync
 */
export const emailSync = pgTable(
    'email_sync',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        integrationId: text('integration_id')
            .notNull()
            .references(() => integration.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Gmail message data
        messageId: text('message_id').notNull(), // Gmail message ID
        threadId: text('thread_id'), // Gmail thread ID

        // Email metadata
        subject: text('subject'),
        fromEmail: text('from_email'),
        fromName: text('from_name'),
        toEmails: jsonb('to_emails').$type<string[]>(),
        ccEmails: jsonb('cc_emails').$type<string[]>(),

        // Email content
        snippet: text('snippet'),
        bodyText: text('body_text'),
        bodyHtml: text('body_html'),

        // Timestamps
        emailDate: timestamp('email_date').notNull(),
        receivedAt: timestamp('received_at'),

        // Linked CRM entities (populated after processing)
        interactionId: text('interaction_id'), // Link to created interaction
        contactId: text('contact_id'),
        companyId: text('company_id'),
        dealId: text('deal_id'),

        // Processing status
        processed: boolean('processed').default(false).notNull(),
        processedAt: timestamp('processed_at'),

        // Labels/folders
        labels: jsonb('labels').$type<string[]>(),

        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('email_sync_integration_id_idx').on(table.integrationId),
        index('email_sync_user_id_idx').on(table.userId),
        index('email_sync_message_id_idx').on(table.messageId),
        index('email_sync_from_email_idx').on(table.fromEmail),
        index('email_sync_contact_id_idx').on(table.contactId),
    ],
);

/**
 * Calendar sync log
 * Tracks synced calendar events
 */
export const calendarSync = pgTable(
    'calendar_sync',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        integrationId: text('integration_id')
            .notNull()
            .references(() => integration.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Google Calendar event data
        eventId: text('event_id').notNull(), // Google Calendar event ID
        calendarId: text('calendar_id').notNull(),

        // Event details
        summary: text('summary'),
        description: text('description'),
        location: text('location'),

        // Timing
        startTime: timestamp('start_time').notNull(),
        endTime: timestamp('end_time').notNull(),
        isAllDay: boolean('is_all_day').default(false).notNull(),
        timezone: text('timezone'),

        // Attendees
        attendees: jsonb('attendees').$type<{
            email: string;
            name?: string;
            responseStatus?: string;
        }[]>(),
        organizerEmail: text('organizer_email'),

        // Meeting details
        meetingLink: text('meeting_link'),
        conferenceType: text('conference_type'), // 'google_meet', 'zoom', etc.

        // Status
        status: text('status'), // 'confirmed', 'tentative', 'cancelled'

        // Linked CRM entities
        interactionId: text('interaction_id'),
        contactId: text('contact_id'),
        companyId: text('company_id'),
        dealId: text('deal_id'),
        taskId: text('task_id'),

        // Processing
        processed: boolean('processed').default(false).notNull(),
        processedAt: timestamp('processed_at'),

        // Sync metadata
        etag: text('etag'),
        lastUpdatedExternal: timestamp('last_updated_external'),

        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('calendar_sync_integration_id_idx').on(table.integrationId),
        index('calendar_sync_user_id_idx').on(table.userId),
        index('calendar_sync_event_id_idx').on(table.eventId),
        index('calendar_sync_start_time_idx').on(table.startTime),
        index('calendar_sync_contact_id_idx').on(table.contactId),
    ],
);

// Type exports
export type IntegrationSelect = typeof integration.$inferSelect;
export type IntegrationInsert = typeof integration.$inferInsert;
export type EmailSyncSelect = typeof emailSync.$inferSelect;
export type EmailSyncInsert = typeof emailSync.$inferInsert;
export type CalendarSyncSelect = typeof calendarSync.$inferSelect;
export type CalendarSyncInsert = typeof calendarSync.$inferInsert;
