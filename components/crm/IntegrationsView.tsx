'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Mail,
    Calendar,
    Key,
    Plus,
    Trash2,
    RefreshCw,
    Check,
    AlertCircle,
    Clock,
    Copy,
    Eye,
    EyeOff,
    ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/client';
import { toast } from 'sonner';
import { WebhooksView } from './WebhooksView';

interface IntegrationsViewProps {
    onNavigate?: (view: string, params?: any) => void;
}

export function IntegrationsView({ onNavigate }: IntegrationsViewProps) {
    const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);
    const [showNewKey, setShowNewKey] = useState(false);
    const queryClient = useQueryClient();

    // Fetch integrations
    const { data: integrationsData, isLoading: loadingIntegrations } = useQuery({
        queryKey: ['integrations'],
        queryFn: () => apiClient.get('/api/v1/integrations').then((res) => res.json()),
    });

    // Fetch API keys
    const { data: apiKeysData, isLoading: loadingApiKeys } = useQuery({
        queryKey: ['api-keys'],
        queryFn: () => apiClient.get('/api/v1/api-keys').then((res) => res.json()),
    });

    // Connect Google mutation
    const connectGoogleMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.get('/api/v1/integrations/google/auth');
            const data = await res.json();
            return data.authUrl;
        },
        onSuccess: (authUrl) => {
            window.location.href = authUrl;
        },
        onError: () => {
            toast.error('Failed to initiate Google connection');
        },
    });

    // Disconnect integration mutation
    const disconnectMutation = useMutation({
        mutationFn: async (integrationId: string) => {
            await apiClient.delete(`/api/v1/integrations/${integrationId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            toast.success('Integration disconnected');
        },
        onError: () => {
            toast.error('Failed to disconnect integration');
        },
    });

    // Trigger sync mutation
    const triggerSyncMutation = useMutation({
        mutationFn: async ({ integrationId, type }: { integrationId: string; type: string }) => {
            await apiClient.post(`/api/v1/integrations/${integrationId}/sync`, {
                body: JSON.stringify({ type, fullSync: false }),
                headers: { 'Content-Type': 'application/json' },
            });
        },
        onSuccess: () => {
            toast.success('Sync started');
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
        },
        onError: () => {
            toast.error('Failed to start sync');
        },
    });

    // Create API key mutation
    const createApiKeyMutation = useMutation({
        mutationFn: async (data: { name: string; scopes: string[] }) => {
            const res = await apiClient.post('/api/v1/api-keys', {
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
            return res.json();
        },
        onSuccess: (data) => {
            setNewApiKey(data.apiKey.key);
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast.success('API key created');
        },
        onError: () => {
            toast.error('Failed to create API key');
        },
    });

    // Delete API key mutation
    const deleteApiKeyMutation = useMutation({
        mutationFn: async (keyId: string) => {
            await apiClient.delete(`/api/v1/api-keys/${keyId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast.success('API key deleted');
        },
        onError: () => {
            toast.error('Failed to delete API key');
        },
    });

    const [newKeyForm, setNewKeyForm] = useState({
        name: '',
        scopes: ['all:read'],
    });

    const handleCreateApiKey = () => {
        if (!newKeyForm.name) {
            toast.error('Name is required');
            return;
        }
        createApiKeyMutation.mutate(newKeyForm);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSyncStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" />Synced</Badge>;
            case 'syncing':
                return <Badge className="bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Syncing</Badge>;
            case 'error':
                return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
            default:
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Idle</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-500 mt-1">Connect external services and manage API access</p>
            </div>

            {/* Google Integration */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Email & Calendar</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Gmail */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Mail className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Gmail</CardTitle>
                                    <CardDescription className="text-xs">Sync emails as interactions</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {integrationsData?.integrations?.find((i: any) => i.provider === 'google' && i.gmailEnabled) ? (
                                <div className="space-y-3">
                                    {integrationsData.integrations
                                        .filter((i: any) => i.provider === 'google' && i.gmailEnabled)
                                        .map((integration: any) => (
                                            <div key={integration.id} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">{integration.connectedEmail}</span>
                                                    {getSyncStatusBadge(integration.emailSyncStatus)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Last sync: {formatDate(integration.lastEmailSync)}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => triggerSyncMutation.mutate({ integrationId: integration.id, type: 'gmail' })}
                                                        disabled={triggerSyncMutation.isPending}
                                                    >
                                                        <RefreshCw className="w-3 h-3 mr-1" />
                                                        Sync Now
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600"
                                                        onClick={() => disconnectMutation.mutate(integration.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Disconnect
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <Button
                                    onClick={() => connectGoogleMutation.mutate()}
                                    disabled={connectGoogleMutation.isPending}
                                    className="w-full"
                                >
                                    Connect Gmail
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Google Calendar */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Google Calendar</CardTitle>
                                    <CardDescription className="text-xs">Sync meetings as interactions</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {integrationsData?.integrations?.find((i: any) => i.provider === 'google' && i.calendarEnabled) ? (
                                <div className="space-y-3">
                                    {integrationsData.integrations
                                        .filter((i: any) => i.provider === 'google' && i.calendarEnabled)
                                        .map((integration: any) => (
                                            <div key={integration.id} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">{integration.connectedEmail}</span>
                                                    {getSyncStatusBadge(integration.calendarSyncStatus)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Last sync: {formatDate(integration.lastCalendarSync)}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => triggerSyncMutation.mutate({ integrationId: integration.id, type: 'calendar' })}
                                                        disabled={triggerSyncMutation.isPending}
                                                    >
                                                        <RefreshCw className="w-3 h-3 mr-1" />
                                                        Sync Now
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <Button
                                    onClick={() => connectGoogleMutation.mutate()}
                                    disabled={connectGoogleMutation.isPending}
                                    className="w-full"
                                >
                                    Connect Calendar
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* API Keys */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold">API Keys</h2>
                        <p className="text-sm text-gray-500">Create API keys for external integrations</p>
                    </div>
                    <Button onClick={() => setShowApiKeyDialog(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New API Key
                    </Button>
                </div>

                <div className="space-y-3">
                    {apiKeysData?.apiKeys?.length === 0 && (
                        <Card className="p-8 text-center">
                            <Key className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">No API keys yet</p>
                            <p className="text-sm text-gray-400 mt-1">Create an API key to allow external systems to push data</p>
                        </Card>
                    )}

                    {apiKeysData?.apiKeys?.map((key: any) => (
                        <Card key={key.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Key className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{key.name}</div>
                                            <div className="text-sm text-gray-500 font-mono">{key.keyPrefix}...</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text-sm">
                                            <div className="text-gray-500">
                                                {key.usageCount} requests
                                            </div>
                                            <div className="text-gray-400 text-xs">
                                                Last used: {formatDate(key.lastUsedAt)}
                                            </div>
                                        </div>
                                        <Badge variant={key.isActive ? 'default' : 'secondary'}>
                                            {key.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this API key?')) {
                                                    deleteApiKeyMutation.mutate(key.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    {(key.scopes as string[]).map((scope: string) => (
                                        <Badge key={scope} variant="outline" className="text-xs">
                                            {scope}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* API Documentation Link */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Public API</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Use API keys to push contacts, deals, and interactions from external systems
                            </p>
                        </div>
                        <Button variant="outline" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View Documentation
                        </Button>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded-lg border">
                        <div className="text-xs text-gray-500 mb-1">Base URL</div>
                        <code className="text-sm font-mono text-gray-800">{process.env.NEXT_PUBLIC_APP_URL || 'https://app.subsignal.com'}/api/public/v1</code>
                    </div>
                </CardContent>
            </Card>

            {/* Webhooks Section */}
            <WebhooksView />

            {/* Create API Key Dialog */}
            <Dialog open={showApiKeyDialog} onOpenChange={(open) => {
                setShowApiKeyDialog(open);
                if (!open) {
                    setNewApiKey(null);
                    setNewKeyForm({ name: '', scopes: ['all:read'] });
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{newApiKey ? 'API Key Created' : 'Create API Key'}</DialogTitle>
                        <DialogDescription>
                            {newApiKey
                                ? 'Copy this key now. You will not be able to see it again.'
                                : 'Create an API key for external system integrations'}
                        </DialogDescription>
                    </DialogHeader>

                    {newApiKey ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        Make sure to copy your API key now. You will not be able to see it again!
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    value={showNewKey ? newApiKey : '•'.repeat(40)}
                                    readOnly
                                    className="pr-20 font-mono text-sm"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowNewKey(!showNewKey)}
                                    >
                                        {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(newApiKey)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => {
                                    setShowApiKeyDialog(false);
                                    setNewApiKey(null);
                                    setNewKeyForm({ name: '', scopes: ['all:read'] });
                                }}>
                                    Done
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <Label>Name</Label>
                                <Input
                                    placeholder="e.g., Zapier Integration"
                                    value={newKeyForm.name}
                                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Permissions</Label>
                                <Select
                                    value={newKeyForm.scopes[0]}
                                    onValueChange={(value) => setNewKeyForm(prev => ({ ...prev, scopes: [value] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all:read">Read Only (all resources)</SelectItem>
                                        <SelectItem value="all:write">Read & Write (all resources)</SelectItem>
                                        <SelectItem value="contacts:write">Contacts Only</SelectItem>
                                        <SelectItem value="deals:write">Deals Only</SelectItem>
                                        <SelectItem value="interactions:write">Interactions Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateApiKey}
                                    disabled={createApiKeyMutation.isPending}
                                >
                                    {createApiKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
