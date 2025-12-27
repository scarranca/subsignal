import { pgTable, text, timestamp, boolean, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Organization roles
 */
export const orgRoleEnum = pgEnum('org_role', [
    'owner',    // Full access, can delete org, manage billing
    'admin',    // Can manage members, settings, all CRM data
    'member',   // Can create/edit CRM data, view all
    'viewer',   // Read-only access to CRM data
]);

/**
 * Invitation status
 */
export const inviteStatusEnum = pgEnum('invite_status', [
    'pending',
    'accepted',
    'expired',
    'revoked',
]);

/**
 * Organization - the team/workspace that owns CRM data
 */
export const organization = pgTable(
    'organization',
    {
        id: text('id').primaryKey(),
        name: text('name').notNull(),
        slug: text('slug').notNull().unique(),
        logo: text('logo'),

        // Settings
        defaultPipelineId: text('default_pipeline_id'),
        timezone: text('timezone').default('UTC'),
        dateFormat: text('date_format').default('MM/DD/YYYY'),
        currency: text('currency').default('USD'),

        // Limits (for billing tiers)
        maxMembers: text('max_members').default('5'),
        maxContacts: text('max_contacts').default('1000'),
        maxDeals: text('max_deals').default('500'),

        // Metadata
        createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
        updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
        createdBy: text('created_by').references(() => user.id),
    },
    (table) => [
        index('organization_slug_idx').on(table.slug),
        index('organization_created_by_idx').on(table.createdBy),
    ],
);

/**
 * Organization membership - links users to organizations with roles
 */
export const organizationMember = pgTable(
    'organization_member',
    {
        id: text('id').primaryKey(),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        role: orgRoleEnum('role').notNull().default('member'),

        // Member settings
        title: text('title'), // Job title within org
        department: text('department'),

        // Assignment tracking
        canBeAssigned: boolean('can_be_assigned').default(true), // Can have deals/tasks assigned

        // Timestamps
        joinedAt: timestamp('joined_at').$defaultFn(() => new Date()).notNull(),
        updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
        invitedBy: text('invited_by').references(() => user.id),
    },
    (table) => [
        uniqueIndex('organization_member_unique_idx').on(table.organizationId, table.userId),
        index('organization_member_org_idx').on(table.organizationId),
        index('organization_member_user_idx').on(table.userId),
        index('organization_member_role_idx').on(table.role),
    ],
);

/**
 * Organization invitations - pending invites to join
 */
export const organizationInvite = pgTable(
    'organization_invite',
    {
        id: text('id').primaryKey(),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        email: text('email').notNull(),
        role: orgRoleEnum('role').notNull().default('member'),
        status: inviteStatusEnum('status').notNull().default('pending'),

        // Token for accepting invite
        token: text('token').notNull().unique(),

        // Timestamps
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
        acceptedAt: timestamp('accepted_at'),

        // Who sent the invite
        invitedBy: text('invited_by')
            .notNull()
            .references(() => user.id),
    },
    (table) => [
        index('organization_invite_org_idx').on(table.organizationId),
        index('organization_invite_email_idx').on(table.email),
        index('organization_invite_token_idx').on(table.token),
        index('organization_invite_status_idx').on(table.status),
    ],
);

/**
 * User's current organization selection
 */
export const userOrganization = pgTable(
    'user_organization',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: 'cascade' }),
        currentOrganizationId: text('current_organization_id')
            .references(() => organization.id, { onDelete: 'set null' }),
        updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
    },
    (table) => [
        index('user_organization_user_idx').on(table.userId),
    ],
);

// Type exports
export type OrganizationSelect = typeof organization.$inferSelect;
export type OrganizationInsert = typeof organization.$inferInsert;
export type OrganizationMemberSelect = typeof organizationMember.$inferSelect;
export type OrganizationMemberInsert = typeof organizationMember.$inferInsert;
export type OrganizationInviteSelect = typeof organizationInvite.$inferSelect;
export type OrganizationInviteInsert = typeof organizationInvite.$inferInsert;
export type UserOrganizationSelect = typeof userOrganization.$inferSelect;
export type UserOrganizationInsert = typeof userOrganization.$inferInsert;
export type OrgRole = (typeof orgRoleEnum.enumValues)[number];
export type InviteStatus = (typeof inviteStatusEnum.enumValues)[number];
