'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Users,
    UserPlus,
    MoreHorizontal,
    Crown,
    Shield,
    User,
    Eye,
    Mail,
    Loader2,
    Trash2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrganizationOnboarding } from './OrganizationOnboarding';

interface Member {
    id: string;
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    title?: string;
    department?: string;
    joinedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
}

interface Invite {
    id: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    status: string;
    expiresAt: string;
    createdAt: string;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    members: Member[];
}

const roleIcons = {
    owner: Crown,
    admin: Shield,
    member: User,
    viewer: Eye,
};

const roleLabels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
};

const roleBadgeVariants = {
    owner: 'default',
    admin: 'secondary',
    member: 'outline',
    viewer: 'outline',
} as const;

export function TeamView() {
    const queryClient = useQueryClient();
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

    // Fetch current organization
    const { data: orgData, isLoading } = useQuery({
        queryKey: ['current-organization'],
        queryFn: async () => {
            const res = await apiClient.get('/api/v1/organizations/current');
            if (!res.ok) throw new Error('Failed to fetch organization');
            return res.json() as Promise<Organization>;
        },
    });

    // Fetch pending invites
    const { data: invitesData } = useQuery({
        queryKey: ['organization-invites', orgData?.id],
        queryFn: async () => {
            if (!orgData?.id) return { invites: [] };
            const res = await apiClient.get(`/api/v1/organizations/${orgData.id}/invites`);
            if (!res.ok) throw new Error('Failed to fetch invites');
            return res.json() as Promise<{ invites: Invite[] }>;
        },
        enabled: !!orgData?.id,
    });

    // Invite member mutation
    const inviteMutation = useMutation({
        mutationFn: async () => {
            if (!orgData?.id) throw new Error('No organization');
            const res = await apiClient.post(`/api/v1/organizations/${orgData.id}/invites`, {
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to send invite');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
            setInviteDialogOpen(false);
            setInviteEmail('');
            setInviteRole('member');
            toast.success('Invitation sent successfully');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to send invite');
        },
    });

    // Update member role mutation
    const updateRoleMutation = useMutation({
        mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
            if (!orgData?.id) throw new Error('No organization');
            const res = await apiClient.patch(`/api/v1/organizations/${orgData.id}/members/${memberId}`, {
                body: JSON.stringify({ role }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update role');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-organization'] });
            toast.success('Role updated successfully');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to update role');
        },
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: async (memberId: string) => {
            if (!orgData?.id) throw new Error('No organization');
            const res = await apiClient.delete(`/api/v1/organizations/${orgData.id}/members/${memberId}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to remove member');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-organization'] });
            toast.success('Member removed successfully');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to remove member');
        },
    });

    // Revoke invite mutation
    const revokeInviteMutation = useMutation({
        mutationFn: async (inviteId: string) => {
            if (!orgData?.id) throw new Error('No organization');
            const res = await apiClient.delete(`/api/v1/organizations/${orgData.id}/invites/${inviteId}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to revoke invite');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
            toast.success('Invitation revoked');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to revoke invite');
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!orgData) {
        return <OrganizationOnboarding />;
    }

    const members = orgData.members || [];
    const invites = invitesData?.invites || [];

    return (
        <div className="px-4 md:px-8 py-6 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Team</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage your team and their access levels
                    </p>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white shadow-lg max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-900">Invite Team Member</DialogTitle>
                            <DialogDescription className="text-gray-600">
                                Send an invitation to join {orgData.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="colleague@company.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Role</Label>
                                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                Admin - Full access, manage team
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="member">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                Member - Create and edit data
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="viewer">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                Viewer - Read-only access
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button variant="outline" onClick={() => setInviteDialogOpen(false)} className="hover:bg-gray-50 w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button
                                onClick={() => inviteMutation.mutate()}
                                disabled={!inviteEmail || inviteMutation.isPending}
                                className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto"
                            >
                                {inviteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Mail className="w-4 h-4 mr-2" />
                                )}
                                Send Invitation
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Members List */}
            <div className="space-y-8">
                <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-4">Members ({members.length})</h2>
                    <div className="space-y-3">
                        {members.map((member) => {
                            const RoleIcon = roleIcons[member.role];
                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.user.image || undefined} />
                                            <AvatarFallback className="bg-gray-100 text-gray-600">
                                                {member.user.name?.slice(0, 2).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.user.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {member.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={roleBadgeVariants[member.role]} className="gap-1">
                                            <RoleIcon className="w-3 h-3" />
                                            {roleLabels[member.role]}
                                        </Badge>
                                        {member.role !== 'owner' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                                                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white">
                                                    <DropdownMenuItem
                                                        onClick={() => updateRoleMutation.mutate({
                                                            memberId: member.userId,
                                                            role: 'admin',
                                                        })}
                                                        disabled={member.role === 'admin'}
                                                    >
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        Make Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => updateRoleMutation.mutate({
                                                            memberId: member.userId,
                                                            role: 'member',
                                                        })}
                                                        disabled={member.role === 'member'}
                                                    >
                                                        <User className="w-4 h-4 mr-2" />
                                                        Make Member
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => updateRoleMutation.mutate({
                                                            memberId: member.userId,
                                                            role: 'viewer',
                                                        })}
                                                        disabled={member.role === 'viewer'}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Make Viewer
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => removeMemberMutation.mutate(member.userId)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Invitations */}
                {invites.length > 0 && (
                    <div>
                        <h2 className="text-sm font-medium text-gray-500 mb-4">Pending Invitations ({invites.length})</h2>
                        <div className="space-y-3">
                            {invites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{invite.email}</p>
                                            <p className="text-sm text-gray-500">
                                                Invited as {roleLabels[invite.role]} · Expires{' '}
                                                {new Date(invite.expiresAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => revokeInviteMutation.mutate(invite.id)}
                                        disabled={revokeInviteMutation.isPending}
                                        className="hover:bg-gray-200"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
