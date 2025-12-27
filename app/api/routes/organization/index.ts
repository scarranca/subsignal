import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetOrganizations,
    handleGetOrganization,
    handleGetCurrentOrganization,
    handleCreateOrganization,
    handleUpdateOrganization,
    handleSwitchOrganization,
    handleGetMembers,
    handleGetAssignableMembers,
    handleUpdateMemberRole,
    handleRemoveMember,
    handleInviteMember,
    handleGetInvites,
    handleAcceptInvite,
    handleRevokeInvite,
    handleLeaveOrganization,
} from '@/app/api/handlers/organization';

const organizations = new Hono();

// Apply auth middleware to all organization routes
organizations.use('*', requireAuth);

// ============== Organization Management ==============

// GET /api/v1/organizations - List all organizations for current user
organizations.get('/', handleGetOrganizations);

// GET /api/v1/organizations/current - Get current organization
organizations.get('/current', handleGetCurrentOrganization);

// POST /api/v1/organizations - Create new organization
organizations.post('/', handleCreateOrganization);

// GET /api/v1/organizations/:id - Get specific organization
organizations.get('/:id', handleGetOrganization);

// PATCH /api/v1/organizations/:id - Update organization settings
organizations.patch('/:id', handleUpdateOrganization);

// POST /api/v1/organizations/:id/switch - Switch to this organization
organizations.post('/:id/switch', handleSwitchOrganization);

// POST /api/v1/organizations/:id/leave - Leave organization
organizations.post('/:id/leave', handleLeaveOrganization);

// ============== Member Management ==============

// GET /api/v1/organizations/:id/members - List organization members
organizations.get('/:id/members', handleGetMembers);

// GET /api/v1/organizations/:id/members/assignable - Get assignable members
organizations.get('/:id/members/assignable', handleGetAssignableMembers);

// PATCH /api/v1/organizations/:id/members/:memberId - Update member role
organizations.patch('/:id/members/:memberId', handleUpdateMemberRole);

// DELETE /api/v1/organizations/:id/members/:memberId - Remove member
organizations.delete('/:id/members/:memberId', handleRemoveMember);

// ============== Invitation Management ==============

// POST /api/v1/organizations/:id/invites - Invite new member
organizations.post('/:id/invites', handleInviteMember);

// GET /api/v1/organizations/:id/invites - Get pending invites
organizations.get('/:id/invites', handleGetInvites);

// DELETE /api/v1/organizations/:id/invites/:inviteId - Revoke invite
organizations.delete('/:id/invites/:inviteId', handleRevokeInvite);

// POST /api/v1/organizations/invites/:token/accept - Accept invitation (public)
organizations.post('/invites/:token/accept', handleAcceptInvite);

export default organizations;
