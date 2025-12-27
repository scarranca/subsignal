import { pgTable, text, timestamp, boolean, jsonb, index, pgEnum, integer } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * API key permission scopes
 */
export const apiKeyScopeEnum = pgEnum('api_key_scope', [
    'contacts:read',
    'contacts:write',
    'companies:read',
    'companies:write',
    'deals:read',
    'deals:write',
    'interactions:read',
    'interactions:write',
    'tasks:read',
    'tasks:write',
    'all:read',
    'all:write',
]);

export type ApiKeyScope = (typeof apiKeyScopeEnum.enumValues)[number];

/**
 * API Keys table
 * Stores API keys for external system integrations
 */
export const apiKey = pgTable(
    'api_key',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Key info
        name: text('name').notNull(), // User-friendly name
        description: text('description'),

        // The actual key (hashed for storage, only shown once on creation)
        keyHash: text('key_hash').notNull(),
        keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification (e.g., "crm_live_")

        // Permissions
        scopes: jsonb('scopes').$type<ApiKeyScope[]>().notNull(),

        // Rate limiting
        rateLimit: integer('rate_limit').default(1000).notNull(), // Requests per hour
        rateLimitWindow: integer('rate_limit_window').default(3600).notNull(), // Window in seconds

        // IP restrictions (optional)
        allowedIps: jsonb('allowed_ips').$type<string[]>(),

        // Usage tracking
        lastUsedAt: timestamp('last_used_at'),
        usageCount: integer('usage_count').default(0).notNull(),

        // Status
        isActive: boolean('is_active').default(true).notNull(),
        expiresAt: timestamp('expires_at'), // Optional expiration

        // Metadata
        metadata: jsonb('metadata').$type<Record<string, unknown>>(),

        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('api_key_user_id_idx').on(table.userId),
        index('api_key_key_prefix_idx').on(table.keyPrefix),
        index('api_key_is_active_idx').on(table.isActive),
    ],
);

/**
 * API Key usage logs
 * Tracks API key usage for analytics and rate limiting
 */
export const apiKeyLog = pgTable(
    'api_key_log',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        apiKeyId: text('api_key_id')
            .notNull()
            .references(() => apiKey.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Request info
        method: text('method').notNull(), // GET, POST, PATCH, DELETE
        path: text('path').notNull(), // API path
        statusCode: integer('status_code').notNull(),

        // Request metadata
        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),

        // Response info
        responseTime: integer('response_time'), // in milliseconds

        // Rate limit info at time of request
        rateLimitRemaining: integer('rate_limit_remaining'),

        // Error details (if any)
        errorMessage: text('error_message'),

        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('api_key_log_api_key_id_idx').on(table.apiKeyId),
        index('api_key_log_user_id_idx').on(table.userId),
        index('api_key_log_created_at_idx').on(table.createdAt),
    ],
);

/**
 * Webhook endpoints for push notifications
 * Allows external systems to receive real-time updates
 */
export const webhook = pgTable(
    'webhook',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Webhook configuration
        name: text('name').notNull(),
        url: text('url').notNull(),
        secret: text('secret').notNull(), // For signature verification

        // Events to listen to
        events: jsonb('events').$type<string[]>().notNull(),
        // e.g., ['contact.created', 'deal.updated', 'task.completed']

        // Headers to include in requests
        headers: jsonb('headers').$type<Record<string, string>>(),

        // Status
        isActive: boolean('is_active').default(true).notNull(),

        // Delivery tracking
        lastDeliveryAt: timestamp('last_delivery_at'),
        lastDeliveryStatus: text('last_delivery_status'),
        consecutiveFailures: integer('consecutive_failures').default(0).notNull(),

        // Auto-disable after failures
        disabledAt: timestamp('disabled_at'),
        disabledReason: text('disabled_reason'),

        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('webhook_user_id_idx').on(table.userId),
        index('webhook_is_active_idx').on(table.isActive),
    ],
);

/**
 * Webhook delivery logs
 */
export const webhookDelivery = pgTable(
    'webhook_delivery',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        webhookId: text('webhook_id')
            .notNull()
            .references(() => webhook.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Event info
        eventType: text('event_type').notNull(),
        payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),

        // Delivery status
        statusCode: integer('status_code'),
        responseBody: text('response_body'),
        responseTime: integer('response_time'), // milliseconds

        // Retry tracking
        attempt: integer('attempt').default(1).notNull(),
        maxAttempts: integer('max_attempts').default(3).notNull(),
        nextRetryAt: timestamp('next_retry_at'),

        // Status
        success: boolean('success').default(false).notNull(),
        error: text('error'),

        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('webhook_delivery_webhook_id_idx').on(table.webhookId),
        index('webhook_delivery_user_id_idx').on(table.userId),
        index('webhook_delivery_created_at_idx').on(table.createdAt),
        index('webhook_delivery_next_retry_idx').on(table.nextRetryAt),
    ],
);

// Type exports
export type ApiKeySelect = typeof apiKey.$inferSelect;
export type ApiKeyInsert = typeof apiKey.$inferInsert;
export type ApiKeyLogSelect = typeof apiKeyLog.$inferSelect;
export type ApiKeyLogInsert = typeof apiKeyLog.$inferInsert;
export type WebhookSelect = typeof webhook.$inferSelect;
export type WebhookInsert = typeof webhook.$inferInsert;
export type WebhookDeliverySelect = typeof webhookDelivery.$inferSelect;
export type WebhookDeliveryInsert = typeof webhookDelivery.$inferInsert;
