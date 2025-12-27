import { Context } from 'hono';
import { organizationQueries } from '@/db/queries';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';
import { emailService } from '@/services/email';

// Validation schemas
const createOrganizationSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(50).optional(),
});

const updateOrganizationSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    logo: z.string().url().optional().nullable(),
    timezone: z.string().optional(),
    dateFormat: z.string().optional(),
    currency: z.string().length(3).optional(),
});

const inviteMemberSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member', 'viewer']),
});

const updateMemberRoleSchema = z.object({
    role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

/**
 * Get all organizations for current user
 */
export async function handleGetOrganizations(c: Context) {
    try {
        const user = getUser(c);
        const organizations = await organizationQueries.getUserOrganizations(user.id);
        const current = await organizationQueries.getCurrentOrganization(user.id);

        return c.json({
            organizations,
            currentOrganizationId: current?.id || null,
        });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return c.json({ error: 'Failed to fetch organizations' }, 500);
    }
}

/**
 * Get single organization by ID
 */
export async function handleGetOrganization(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        const organization = await organizationQueries.getOrganizationById(orgId, user.id);

        if (!organization) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        return c.json(organization);
    } catch (error) {
        console.error('Error fetching organization:', error);
        return c.json({ error: 'Failed to fetch organization' }, 500);
    }
}

/**
 * Get current organization
 */
export async function handleGetCurrentOrganization(c: Context) {
    try {
        const user = getUser(c);
        const organization = await organizationQueries.getCurrentOrganization(user.id);

        if (!organization) {
            return c.json({ error: 'No current organization set' }, 404);
        }

        // Get full details with members
        const fullOrg = await organizationQueries.getOrganizationById(organization.id, user.id);

        return c.json(fullOrg);
    } catch (error) {
        console.error('Error fetching current organization:', error);
        return c.json({ error: 'Failed to fetch current organization' }, 500);
    }
}

/**
 * Create a new organization
 */
export async function handleCreateOrganization(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createOrganizationSchema.parse(body);

        const organization = await organizationQueries.createOrganization(user.id, validatedData);

        return c.json(organization, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error creating organization:', error);
        return c.json({ error: 'Failed to create organization' }, 500);
    }
}

/**
 * Update organization settings
 */
export async function handleUpdateOrganization(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');
        const body = await c.req.json();

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        const validatedData = updateOrganizationSchema.parse(body);

        const organization = await organizationQueries.updateOrganization(orgId, user.id, validatedData);

        return c.json(organization);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Insufficient permissions') {
            return c.json({ error: 'Insufficient permissions' }, 403);
        }
        console.error('Error updating organization:', error);
        return c.json({ error: 'Failed to update organization' }, 500);
    }
}

/**
 * Switch current organization
 */
export async function handleSwitchOrganization(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        await organizationQueries.switchOrganization(user.id, orgId);

        const organization = await organizationQueries.getOrganizationById(orgId, user.id);

        return c.json({ success: true, organization });
    } catch (error) {
        if (error instanceof Error && error.message === 'Not a member of this organization') {
            return c.json({ error: 'Not a member of this organization' }, 403);
        }
        console.error('Error switching organization:', error);
        return c.json({ error: 'Failed to switch organization' }, 500);
    }
}

/**
 * Get organization members
 */
export async function handleGetMembers(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        const members = await organizationQueries.getMembers(orgId, user.id);

        return c.json({ members });
    } catch (error) {
        if (error instanceof Error && error.message === 'Not a member of this organization') {
            return c.json({ error: 'Not a member of this organization' }, 403);
        }
        console.error('Error fetching members:', error);
        return c.json({ error: 'Failed to fetch members' }, 500);
    }
}

/**
 * Get assignable members (for deal/task assignment)
 */
export async function handleGetAssignableMembers(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        // Verify user is a member
        const membership = await organizationQueries.getMembership(orgId, user.id);
        if (!membership) {
            return c.json({ error: 'Not a member of this organization' }, 403);
        }

        const members = await organizationQueries.getAssignableMembers(orgId);

        return c.json({ members });
    } catch (error) {
        console.error('Error fetching assignable members:', error);
        return c.json({ error: 'Failed to fetch assignable members' }, 500);
    }
}

/**
 * Update member role
 */
export async function handleUpdateMemberRole(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');
        const memberId = c.req.param('memberId');
        const body = await c.req.json();

        if (!orgId || !memberId) {
            return c.json({ error: 'Organization ID and member ID are required' }, 400);
        }

        const validatedData = updateMemberRoleSchema.parse(body);

        await organizationQueries.updateMemberRole(orgId, memberId, validatedData.role, user.id);

        return c.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error) {
            if (error.message === 'Insufficient permissions') {
                return c.json({ error: 'Insufficient permissions' }, 403);
            }
            if (error.message === 'Cannot demote the last owner') {
                return c.json({ error: 'Cannot demote the last owner' }, 400);
            }
        }
        console.error('Error updating member role:', error);
        return c.json({ error: 'Failed to update member role' }, 500);
    }
}

/**
 * Remove member from organization
 */
export async function handleRemoveMember(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');
        const memberId = c.req.param('memberId');

        if (!orgId || !memberId) {
            return c.json({ error: 'Organization ID and member ID are required' }, 400);
        }

        await organizationQueries.removeMember(orgId, memberId, user.id);

        return c.json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Insufficient permissions') {
                return c.json({ error: 'Insufficient permissions' }, 403);
            }
            if (error.message === 'Cannot remove the last owner') {
                return c.json({ error: 'Cannot remove the last owner' }, 400);
            }
        }
        console.error('Error removing member:', error);
        return c.json({ error: 'Failed to remove member' }, 500);
    }
}

/**
 * Invite member to organization
 */
export async function handleInviteMember(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');
        const body = await c.req.json();

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        const validatedData = inviteMemberSchema.parse(body);

        const invite = await organizationQueries.createInvite(
            orgId,
            validatedData.email,
            validatedData.role,
            user.id
        );

        // Get organization details for email
        const organization = await organizationQueries.getOrganizationById(orgId, user.id);

        // Send invitation email
        try {
            await emailService.sendTeamInvitation({
                to: validatedData.email,
                organizationName: organization?.name || 'Unknown',
                inviterName: user.name,
                role: validatedData.role,
                inviteToken: invite.token,
            });
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // Don't fail the request if email fails - invite is still created
        }

        return c.json({ success: true, invite }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error) {
            if (error.message === 'Insufficient permissions') {
                return c.json({ error: 'Insufficient permissions' }, 403);
            }
            if (error.message === 'Invitation already sent') {
                return c.json({ error: 'Invitation already sent to this email' }, 409);
            }
            if (error.message === 'User is already a member') {
                return c.json({ error: 'User is already a member' }, 409);
            }
        }
        console.error('Error inviting member:', error);
        return c.json({ error: 'Failed to invite member' }, 500);
    }
}

/**
 * Get pending invitations
 */
export async function handleGetInvites(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        const invites = await organizationQueries.getPendingInvites(orgId, user.id);

        return c.json({ invites });
    } catch (error) {
        if (error instanceof Error && error.message === 'Insufficient permissions') {
            return c.json({ error: 'Insufficient permissions' }, 403);
        }
        console.error('Error fetching invites:', error);
        return c.json({ error: 'Failed to fetch invites' }, 500);
    }
}

/**
 * Accept invitation
 */
export async function handleAcceptInvite(c: Context) {
    try {
        const user = getUser(c);
        const token = c.req.param('token');

        if (!token) {
            return c.json({ error: 'Invite token is required' }, 400);
        }

        const organization = await organizationQueries.acceptInvite(token, user.id);

        return c.json({ success: true, organization });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Invalid or expired invitation') {
                return c.json({ error: 'Invalid or expired invitation' }, 400);
            }
            if (error.message === 'Invitation has expired') {
                return c.json({ error: 'Invitation has expired' }, 400);
            }
        }
        console.error('Error accepting invite:', error);
        return c.json({ error: 'Failed to accept invitation' }, 500);
    }
}

/**
 * Revoke invitation
 */
export async function handleRevokeInvite(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');
        const inviteId = c.req.param('inviteId');

        if (!orgId || !inviteId) {
            return c.json({ error: 'Organization ID and invite ID are required' }, 400);
        }

        await organizationQueries.revokeInvite(inviteId, user.id);

        return c.json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Invitation not found') {
                return c.json({ error: 'Invitation not found' }, 404);
            }
            if (error.message === 'Insufficient permissions') {
                return c.json({ error: 'Insufficient permissions' }, 403);
            }
        }
        console.error('Error revoking invite:', error);
        return c.json({ error: 'Failed to revoke invitation' }, 500);
    }
}

/**
 * Leave organization
 */
export async function handleLeaveOrganization(c: Context) {
    try {
        const user = getUser(c);
        const orgId = c.req.param('id');

        if (!orgId) {
            return c.json({ error: 'Organization ID is required' }, 400);
        }

        await organizationQueries.removeMember(orgId, user.id, user.id);

        return c.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Cannot remove the last owner') {
            return c.json({ error: 'Cannot leave as the last owner. Transfer ownership first.' }, 400);
        }
        console.error('Error leaving organization:', error);
        return c.json({ error: 'Failed to leave organization' }, 500);
    }
}
