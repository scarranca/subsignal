import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { organization, organizationMember, organizationInvite, userOrganization, pipeline, pipelineStage, defaultPipelineStages } from '@/db/schema';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import type {
    OrganizationSelect,
    OrganizationInsert,
    OrganizationMemberSelect,
    OrganizationMemberInsert,
    OrganizationInviteSelect,
    OrgRole,
} from '@/db/schema';

export type OrganizationWithMembers = OrganizationSelect & {
    members: (OrganizationMemberSelect & {
        user: { id: string; name: string; email: string; image: string | null };
    })[];
};

export type MemberWithUser = OrganizationMemberSelect & {
    user: { id: string; name: string; email: string; image: string | null };
};

export const organizationQueries = {
    /**
     * Create a new organization and add creator as owner
     */
    async createOrganization(
        userId: string,
        data: { name: string; slug?: string }
    ): Promise<OrganizationSelect> {
        const id = nanoid();
        const now = new Date();
        const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Create organization
        const [org] = await db
            .insert(organization)
            .values({
                id,
                name: data.name,
                slug: `${slug}-${nanoid(6)}`, // Ensure uniqueness
                createdBy: userId,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Add creator as owner
        await db.insert(organizationMember).values({
            id: nanoid(),
            organizationId: org.id,
            userId,
            role: 'owner',
            joinedAt: now,
            updatedAt: now,
        });

        // Set as current organization for user
        await db
            .insert(userOrganization)
            .values({
                id: nanoid(),
                userId,
                currentOrganizationId: org.id,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: userOrganization.userId,
                set: {
                    currentOrganizationId: org.id,
                    updatedAt: now,
                },
            });

        // Create default pipeline for the organization
        const pipelineId = nanoid();
        await db.insert(pipeline).values({
            id: pipelineId,
            organizationId: org.id,
            userId,
            name: 'Sales Pipeline',
            description: 'Default sales pipeline',
            isDefault: true,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Create default pipeline stages
        await Promise.all(
            defaultPipelineStages.map((stage, index) =>
                db.insert(pipelineStage).values({
                    id: nanoid(),
                    pipelineId,
                    name: stage.name,
                    color: stage.color,
                    probability: stage.probability,
                    position: index,
                    isWonStage: stage.name === 'Closed Won',
                    isLostStage: stage.name === 'Closed Lost',
                    createdAt: now,
                    updatedAt: now,
                })
            )
        );

        return org;
    },

    /**
     * Get organization by ID with members
     */
    async getOrganizationById(orgId: string, userId: string): Promise<OrganizationWithMembers | null> {
        // First verify user is a member
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, userId)
            ),
        });

        if (!membership) {
            return null;
        }

        const result = await db.query.organization.findFirst({
            where: eq(organization.id, orgId),
            with: {
                members: {
                    with: {
                        user: {
                            columns: { id: true, name: true, email: true, image: true },
                        },
                    },
                },
            },
        });

        return result as OrganizationWithMembers | null;
    },

    /**
     * Get all organizations for a user
     */
    async getUserOrganizations(userId: string): Promise<OrganizationSelect[]> {
        const memberships = await db.query.organizationMember.findMany({
            where: eq(organizationMember.userId, userId),
            with: {
                organization: true,
            },
        });

        return memberships.map((m) => m.organization);
    },

    /**
     * Get user's current organization
     */
    async getCurrentOrganization(userId: string): Promise<OrganizationSelect | null> {
        const userOrg = await db.query.userOrganization.findFirst({
            where: eq(userOrganization.userId, userId),
            with: {
                currentOrganization: true,
            },
        });

        return userOrg?.currentOrganization || null;
    },

    /**
     * Switch user's current organization
     */
    async switchOrganization(userId: string, orgId: string): Promise<void> {
        // Verify user is a member
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, userId)
            ),
        });

        if (!membership) {
            throw new Error('Not a member of this organization');
        }

        await db
            .insert(userOrganization)
            .values({
                id: nanoid(),
                userId,
                currentOrganizationId: orgId,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: userOrganization.userId,
                set: {
                    currentOrganizationId: orgId,
                    updatedAt: new Date(),
                },
            });
    },

    /**
     * Get organization members
     */
    async getMembers(orgId: string, userId: string): Promise<MemberWithUser[]> {
        // Verify user is a member
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, userId)
            ),
        });

        if (!membership) {
            throw new Error('Not a member of this organization');
        }

        const members = await db.query.organizationMember.findMany({
            where: eq(organizationMember.organizationId, orgId),
            with: {
                user: {
                    columns: { id: true, name: true, email: true, image: true },
                },
            },
            orderBy: [desc(organizationMember.joinedAt)],
        });

        return members as MemberWithUser[];
    },

    /**
     * Update member role
     */
    async updateMemberRole(
        orgId: string,
        targetUserId: string,
        newRole: OrgRole,
        requestingUserId: string
    ): Promise<void> {
        // Verify requesting user is owner or admin
        const requestingMember = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, requestingUserId)
            ),
        });

        if (!requestingMember || !['owner', 'admin'].includes(requestingMember.role)) {
            throw new Error('Insufficient permissions');
        }

        // Cannot demote the last owner
        if (newRole !== 'owner') {
            const owners = await db.query.organizationMember.findMany({
                where: and(
                    eq(organizationMember.organizationId, orgId),
                    eq(organizationMember.role, 'owner')
                ),
            });

            if (owners.length === 1 && owners[0].userId === targetUserId) {
                throw new Error('Cannot demote the last owner');
            }
        }

        await db
            .update(organizationMember)
            .set({ role: newRole, updatedAt: new Date() })
            .where(
                and(
                    eq(organizationMember.organizationId, orgId),
                    eq(organizationMember.userId, targetUserId)
                )
            );
    },

    /**
     * Remove member from organization
     */
    async removeMember(
        orgId: string,
        targetUserId: string,
        requestingUserId: string
    ): Promise<void> {
        // Verify requesting user is owner or admin (or removing self)
        const requestingMember = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, requestingUserId)
            ),
        });

        const isSelf = targetUserId === requestingUserId;
        const hasPermission = requestingMember && ['owner', 'admin'].includes(requestingMember.role);

        if (!isSelf && !hasPermission) {
            throw new Error('Insufficient permissions');
        }

        // Cannot remove the last owner
        const targetMember = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, targetUserId)
            ),
        });

        if (targetMember?.role === 'owner') {
            const owners = await db.query.organizationMember.findMany({
                where: and(
                    eq(organizationMember.organizationId, orgId),
                    eq(organizationMember.role, 'owner')
                ),
            });

            if (owners.length === 1) {
                throw new Error('Cannot remove the last owner');
            }
        }

        await db
            .delete(organizationMember)
            .where(
                and(
                    eq(organizationMember.organizationId, orgId),
                    eq(organizationMember.userId, targetUserId)
                )
            );
    },

    /**
     * Create invitation
     */
    async createInvite(
        orgId: string,
        email: string,
        role: OrgRole,
        invitedByUserId: string
    ): Promise<OrganizationInviteSelect> {
        // Verify inviter is owner or admin
        const inviter = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, invitedByUserId)
            ),
        });

        if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
            throw new Error('Insufficient permissions');
        }

        // Check if already invited
        const existingInvite = await db.query.organizationInvite.findFirst({
            where: and(
                eq(organizationInvite.organizationId, orgId),
                eq(organizationInvite.email, email.toLowerCase()),
                eq(organizationInvite.status, 'pending')
            ),
        });

        if (existingInvite) {
            throw new Error('Invitation already sent');
        }

        // Check if already a member
        const existingMember = await db
            .select()
            .from(organizationMember)
            .innerJoin(sql`"user" u ON ${organizationMember.userId} = u.id`)
            .where(
                and(
                    eq(organizationMember.organizationId, orgId),
                    sql`u.email = ${email.toLowerCase()}`
                )
            );

        if (existingMember.length > 0) {
            throw new Error('User is already a member');
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const [invite] = await db
            .insert(organizationInvite)
            .values({
                id: nanoid(),
                organizationId: orgId,
                email: email.toLowerCase(),
                role,
                status: 'pending',
                token: crypto.randomBytes(32).toString('hex'),
                expiresAt,
                createdAt: now,
                invitedBy: invitedByUserId,
            })
            .returning();

        return invite;
    },

    /**
     * Get pending invites for an organization
     */
    async getPendingInvites(orgId: string, userId: string): Promise<OrganizationInviteSelect[]> {
        // Verify user is owner or admin
        const member = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, userId)
            ),
        });

        if (!member || !['owner', 'admin'].includes(member.role)) {
            throw new Error('Insufficient permissions');
        }

        return db.query.organizationInvite.findMany({
            where: and(
                eq(organizationInvite.organizationId, orgId),
                eq(organizationInvite.status, 'pending')
            ),
            orderBy: [desc(organizationInvite.createdAt)],
        });
    },

    /**
     * Accept invitation
     */
    async acceptInvite(token: string, userId: string): Promise<OrganizationSelect> {
        const invite = await db.query.organizationInvite.findFirst({
            where: and(
                eq(organizationInvite.token, token),
                eq(organizationInvite.status, 'pending')
            ),
            with: {
                organization: true,
            },
        });

        if (!invite) {
            throw new Error('Invalid or expired invitation');
        }

        if (invite.expiresAt < new Date()) {
            await db
                .update(organizationInvite)
                .set({ status: 'expired' })
                .where(eq(organizationInvite.id, invite.id));
            throw new Error('Invitation has expired');
        }

        const now = new Date();

        // Add as member
        await db.insert(organizationMember).values({
            id: nanoid(),
            organizationId: invite.organizationId,
            userId,
            role: invite.role,
            joinedAt: now,
            updatedAt: now,
            invitedBy: invite.invitedBy,
        });

        // Mark invite as accepted
        await db
            .update(organizationInvite)
            .set({ status: 'accepted', acceptedAt: now })
            .where(eq(organizationInvite.id, invite.id));

        // Set as current organization
        await db
            .insert(userOrganization)
            .values({
                id: nanoid(),
                userId,
                currentOrganizationId: invite.organizationId,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: userOrganization.userId,
                set: {
                    currentOrganizationId: invite.organizationId,
                    updatedAt: now,
                },
            });

        return invite.organization;
    },

    /**
     * Revoke invitation
     */
    async revokeInvite(inviteId: string, userId: string): Promise<void> {
        const invite = await db.query.organizationInvite.findFirst({
            where: eq(organizationInvite.id, inviteId),
        });

        if (!invite) {
            throw new Error('Invitation not found');
        }

        // Verify user is owner or admin
        const member = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, invite.organizationId),
                eq(organizationMember.userId, userId)
            ),
        });

        if (!member || !['owner', 'admin'].includes(member.role)) {
            throw new Error('Insufficient permissions');
        }

        await db
            .update(organizationInvite)
            .set({ status: 'revoked' })
            .where(eq(organizationInvite.id, inviteId));
    },

    /**
     * Get user's membership in an organization
     */
    async getMembership(orgId: string, userId: string): Promise<OrganizationMemberSelect | null> {
        return db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, userId)
            ),
        });
    },

    /**
     * Update organization settings
     */
    async updateOrganization(
        orgId: string,
        userId: string,
        data: Partial<Pick<OrganizationInsert, 'name' | 'logo' | 'timezone' | 'dateFormat' | 'currency'>>
    ): Promise<OrganizationSelect> {
        // Verify user is owner or admin
        const member = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, userId)
            ),
        });

        if (!member || !['owner', 'admin'].includes(member.role)) {
            throw new Error('Insufficient permissions');
        }

        const [updated] = await db
            .update(organization)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(organization.id, orgId))
            .returning();

        return updated;
    },

    /**
     * Get assignable members (for deal/task assignment)
     */
    async getAssignableMembers(orgId: string): Promise<MemberWithUser[]> {
        const members = await db.query.organizationMember.findMany({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.canBeAssigned, true)
            ),
            with: {
                user: {
                    columns: { id: true, name: true, email: true, image: true },
                },
            },
        });

        return members as MemberWithUser[];
    },
};
