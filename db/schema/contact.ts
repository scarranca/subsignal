import { pgTable, text, timestamp, boolean, index, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { company } from './company';

export const contactStatusEnum = pgEnum('contact_status', [
    'active',
    'inactive',
    'archived',
]);

export const contactSourceEnum = pgEnum('contact_source', [
    'manual',
    'import',
    'linkedin',
    'referral',
    'website',
    'email',
    'other',
]);

export const contact = pgTable(
    'contact',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        companyId: text('company_id').references(() => company.id, { onDelete: 'set null' }),

        // Basic info
        firstName: text('first_name').notNull(),
        lastName: text('last_name'),
        email: text('email'),
        phone: text('phone'),

        // Professional info
        title: text('title'), // Job title
        department: text('department'),

        // Social profiles
        linkedinUrl: text('linkedin_url'),
        twitterUrl: text('twitter_url'),

        // Status and source
        status: contactStatusEnum('status').default('active').notNull(),
        source: contactSourceEnum('source').default('manual').notNull(),

        // Additional data
        avatarUrl: text('avatar_url'),
        notes: text('notes'),
        customFields: jsonb('custom_fields').$type<Record<string, unknown>>(),

        // Metadata
        lastContactedAt: timestamp('last_contacted_at'),
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('contact_user_idx').on(table.userId),
        index('contact_user_active_idx').on(table.userId, table.isActive),
        index('contact_company_idx').on(table.companyId),
        index('contact_email_idx').on(table.email),
        index('contact_user_status_idx').on(table.userId, table.status),
        index('contact_last_contacted_idx').on(table.userId, table.lastContactedAt),
    ],
);

export type ContactSelect = typeof contact.$inferSelect;
export type ContactInsert = typeof contact.$inferInsert;
export type ContactStatus = (typeof contactStatusEnum.enumValues)[number];
export type ContactSource = (typeof contactSourceEnum.enumValues)[number];
