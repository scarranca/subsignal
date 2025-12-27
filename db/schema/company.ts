import { pgTable, text, timestamp, boolean, integer, decimal, index, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { organization } from './organization';

export const companySizeEnum = pgEnum('company_size', [
    'startup',
    'small',
    'medium',
    'large',
    'enterprise',
]);

export const companyTypeEnum = pgEnum('company_type', [
    'prospect',
    'customer',
    'partner',
    'competitor',
    'vendor',
    'other',
]);

export const company = pgTable(
    'company',
    {
        id: text('id').primaryKey(),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        ownerId: text('owner_id').references(() => user.id, { onDelete: 'set null' }), // Assigned owner

        // Basic info
        name: text('name').notNull(),
        url: text('url'),
        description: text('description'),
        logoUrl: text('logo_url'),

        // Classification
        type: companyTypeEnum('type').default('prospect').notNull(),
        industry: text('industry'),
        size: companySizeEnum('size'),

        // Business info
        annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
        employeeCount: integer('employee_count'),
        foundedYear: integer('founded_year'),

        // Contact info
        phone: text('phone'),
        email: text('email'),

        // Address
        address: jsonb('address').$type<{
            street?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        }>(),

        // Social profiles
        linkedinUrl: text('linkedin_url'),
        twitterUrl: text('twitter_url'),

        // Additional data
        tags: text('tags').array(),
        customFields: jsonb('custom_fields').$type<Record<string, unknown>>(),

        // AI-generated data
        aiSummary: text('ai_summary'),
        aiInsights: jsonb('ai_insights').$type<{
            strengths?: string[];
            weaknesses?: string[];
            opportunities?: string[];
            threats?: string[];
            recentNews?: string[];
        }>(),

        // Legacy: Website monitoring (optional premium feature)
        monitoringEnabled: boolean('monitoring_enabled').default(false).notNull(),

        // Metadata
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        // Optimized indexes for actual query patterns
        index('company_org_idx').on(table.organizationId),
        index('company_org_active_idx').on(table.organizationId, table.isActive),
        index('company_org_active_id_idx').on(table.organizationId, table.isActive, table.id),
        index('company_url_org_idx').on(table.url, table.organizationId),
        index('company_org_type_idx').on(table.organizationId, table.type),
        index('company_org_industry_idx').on(table.organizationId, table.industry),
        index('company_owner_idx').on(table.ownerId),
    ],
);

export type CompanySelect = typeof company.$inferSelect;
export type CompanyInsert = typeof company.$inferInsert;
export type CompanySize = (typeof companySizeEnum.enumValues)[number];
export type CompanyType = (typeof companyTypeEnum.enumValues)[number];
