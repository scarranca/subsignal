import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import { authCookiePrefix } from '@/constants/auth';
import { userHooks, accountHooks, sessionHooks } from '@/hooks';

// Re-export for backward compatibility
export { authCookiePrefix };

/**
 * Google OAuth scopes for basic auth
 * https://developers.google.com/identity/protocols/oauth2/scopes
 */
const googleScopes = [
    'openid', // required for Google OAuth
    'email', // read-only access to email
    'profile', // read-only access to profile
];

/**
 * Extended Google OAuth scopes for CRM integrations
 * These are requested when connecting Gmail/Calendar integration
 */
export const GOOGLE_CRM_SCOPES = [
    // Basic
    'openid',
    'email',
    'profile',
    // Gmail
    'https://www.googleapis.com/auth/gmail.readonly', // Read emails
    'https://www.googleapis.com/auth/gmail.send', // Send emails
    'https://www.googleapis.com/auth/gmail.modify', // Modify emails (labels, etc.)
    // Calendar
    'https://www.googleapis.com/auth/calendar.readonly', // Read calendar
    'https://www.googleapis.com/auth/calendar.events', // Create/edit events
];

/**
 * Better Auth configuration
 */
export const auth = betterAuth({
    /**
     * Database Configuration - Drizzle Adapter
     */
    database: drizzleAdapter(db, {
        provider: 'pg', // or "mysql", "sqlite"
    }),

    /**
     * Secret and URL
     */
    secret: process.env.BETTER_AUTH_SECRET,
    url: process.env.BETTER_AUTH_URL,

    /**
     * Email and password - disabled for now
     */
    emailAndPassword: {
        enabled: false,
    },

    /**
     * Social providers
     */
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            scope: googleScopes,
            accessType: 'offline',
            prompt: 'consent',
        },
    },

    /**
     * Account linking
     * https://www.better-auth.com/docs/concepts/users-accounts#account-linking
     * Allows users to associate more than one calendars to their account
     */
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true,
            trustedProviders: ['google'],
        },
    },

    /**
     * Session - 30 days
     * https://better-auth.com/docs/reference/configuration/session
     */
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes cache
        },
    },

    /**
     * Cookie Prefix and Cross-domain configuration
     */
    advanced: {
        cookiePrefix: authCookiePrefix,
        // Only enable cross-domain cookies in production, not on localhost
        ...(process.env.NODE_ENV === 'production' && {
            crossSubDomainCookies: {
                enabled: true,
                domain: '.subsignal.app',
            },
        }),
    },

    /**
     * Database hooks
     * https://better-auth.com/docs/reference/configuration/database-hooks
     */
    databaseHooks: {
        user: userHooks,
        account: accountHooks,
        session: sessionHooks,
    },

    /**
     * Trusted origins
     * https://better-auth.com/docs/reference/configuration/trusted-origins
     */
    trustedOrigins: [
        process.env.BETTER_AUTH_URL || 'http://localhost:3000',
        'https://subsignal.app',
        'https://www.subsignal.app',
    ],

    /**
     * Telemetry
     * https://better-auth.com/docs/reference/configuration/telemetry
     */
    telemetry: {
        enabled: false,
    },
});
