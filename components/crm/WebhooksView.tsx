'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Webhook,
    Plus,
    Trash2,
    RefreshCw,
    Check,
    AlertCircle,
    Clock,
    Copy,
    Eye,
    EyeOff,
    ChevronDown,
    Play,
    History,
    Zap,
} from 'lucide-react';
import { apiClient } from '@/client';
import { toast } from 'sonner';

const EVENT_CATEGORIES = {
    contact: { label: 'Contact', events: ['contact.created', 'contact.updated', 'contact.deleted'] },
    company: { label: 'Company', events: ['company.created', 'company.updated', 'company.deleted'] },
    deal: { label: 'Deal', events: ['deal.created', 'deal.updated', 'deal.stage_changed', 'deal.won', 'deal.lost', 'deal.deleted'] },
    interaction: { label: 'Interaction', events: ['interaction.created', 'interaction.updated'] },
    task: { label: 'Task', events: ['task.created', 'task.completed', 'task.updated'] },
};

export function WebhooksView() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showSecretDialog, setShowSecretDialog] = useState(false);
    const [newSecret, setNewSecret] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
    const [showDeliveries, setShowDeliveries] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch webhooks
    const { data: webhooksData, isLoading } = useQuery({
        queryKey: ['webhooks'],
        queryFn: () => apiClient.get('/api/v1/webhooks').then((res) => res.json()),
    });

    // Fetch deliveries for selected webhook
    const { data: deliveriesData } = useQuery({
        queryKey: ['webhook-deliveries', showDeliveries],
        queryFn: () => apiClient.get(`/api/v1/webhooks/${showDeliveries}/deliveries`).then((res) => res.json()),
        enabled: !!showDeliveries,
    });

    // Create webhook form state
    const [newWebhook, setNewWebhook] = useState({
        name: '',
        url: '',
        events: ['*'] as string[],
    });

    // Create webhook mutation
    const createMutation = useMutation({
        mutationFn: async (data: typeof newWebhook) => {
            const res = await apiClient.post('/api/v1/webhooks', {
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
            return res.json();
        },
        onSuccess: (data) => {
            setNewSecret(data.webhook.secret);
            setShowSecretDialog(true);
            setShowCreateDialog(false);
            setNewWebhook({ name: '', url: '', events: ['*'] });
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            toast.success('Webhook created');
        },
        onError: () => {
            toast.error('Failed to create webhook');
        },
    });

    // Update webhook mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiClient.patch(`/api/v1/webhooks/${id}`, {
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            toast.success('Webhook updated');
        },
        onError: () => {
            toast.error('Failed to update webhook');
        },
    });

    // Delete webhook mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/v1/webhooks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            toast.success('Webhook deleted');
        },
        onError: () => {
            toast.error('Failed to delete webhook');
        },
    });

    // Test webhook mutation
    const testMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post(`/api/v1/webhooks/${id}/test`);
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Test successful (${data.statusCode}) - ${data.responseTime}ms`);
            } else {
                toast.error(`Test failed: ${data.error || `Status ${data.statusCode}`}`);
            }
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        },
        onError: () => {
            toast.error('Failed to test webhook');
        },
    });

    // Regenerate secret mutation
    const regenerateMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post(`/api/v1/webhooks/${id}/regenerate`);
            return res.json();
        },
        onSuccess: (data) => {
            setNewSecret(data.secret);
            setShowSecretDialog(true);
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        },
        onError: () => {
            toast.error('Failed to regenerate secret');
        },
    });

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

    const toggleEvent = (event: string) => {
        setNewWebhook(prev => {
            if (event === '*') {
                return { ...prev, events: ['*'] };
            }
            const events = prev.events.filter(e => e !== '*');
            if (events.includes(event)) {
                return { ...prev, events: events.filter(e => e !== event) };
            }
            return { ...prev, events: [...events, event] };
        });
    };

    const getStatusBadge = (webhook: any) => {
        if (!webhook.isActive) {
            return <Badge variant="secondary">Disabled</Badge>;
        }
        if (webhook.consecutiveFailures > 0) {
            return <Badge className="bg-yellow-100 text-yellow-700">{webhook.consecutiveFailures} failures</Badge>;
        }
        if (webhook.lastDeliveryStatus === 'success') {
            return <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" />Active</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-700">Ready</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Webhooks</h2>
                    <p className="text-sm text-gray-500">Receive real-time notifications when events occur</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Webhook
                </Button>
            </div>

            {/* Webhooks List */}
            <div className="space-y-4">
                {webhooksData?.webhooks?.length === 0 && (
                    <Card className="p-8 text-center">
                        <Webhook className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No webhooks configured</p>
                        <p className="text-sm text-gray-400 mt-1">Add a webhook to receive notifications when data changes</p>
                    </Card>
                )}

                {webhooksData?.webhooks?.map((webhook: any) => (
                    <Card key={webhook.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {webhook.name}
                                            {getStatusBadge(webhook)}
                                        </div>
                                        <div className="text-sm text-gray-500 font-mono mt-1 break-all">{webhook.url}</div>
                                        <div className="text-xs text-gray-400 mt-2">
                                            Last delivery: {formatDate(webhook.lastDeliveryAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={webhook.isActive}
                                        onCheckedChange={(checked) =>
                                            updateMutation.mutate({ id: webhook.id, data: { isActive: checked } })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Events */}
                            <div className="mt-3 flex flex-wrap gap-1">
                                {(webhook.events as string[]).slice(0, 5).map((event: string) => (
                                    <Badge key={event} variant="outline" className="text-xs">
                                        {event}
                                    </Badge>
                                ))}
                                {(webhook.events as string[]).length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{(webhook.events as string[]).length - 5} more
                                    </Badge>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex items-center gap-2 border-t pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => testMutation.mutate(webhook.id)}
                                    disabled={testMutation.isPending}
                                    className="gap-1"
                                >
                                    <Play className="w-3 h-3" />
                                    Test
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeliveries(showDeliveries === webhook.id ? null : webhook.id)}
                                    className="gap-1"
                                >
                                    <History className="w-3 h-3" />
                                    History
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm('Regenerate webhook secret? The old secret will stop working.')) {
                                            regenerateMutation.mutate(webhook.id);
                                        }
                                    }}
                                    className="gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    New Secret
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 ml-auto"
                                    onClick={() => {
                                        if (confirm('Delete this webhook?')) {
                                            deleteMutation.mutate(webhook.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Delivery History */}
                            {showDeliveries === webhook.id && deliveriesData?.deliveries && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="text-sm font-medium mb-3">Recent Deliveries</h4>
                                    {deliveriesData.deliveries.length === 0 ? (
                                        <p className="text-sm text-gray-400">No deliveries yet</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {deliveriesData.deliveries.map((delivery: any) => (
                                                <div
                                                    key={delivery.id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {delivery.success ? (
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                                        )}
                                                        <span className="font-mono text-xs">{delivery.eventType}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span>{delivery.statusCode || 'Error'}</span>
                                                        <span>{delivery.responseTime}ms</span>
                                                        <span>{formatDate(delivery.createdAt)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Signature Verification Info */}
            <Card className="bg-gray-50">
                <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Verifying Webhook Signatures</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Each webhook request includes a signature in the <code className="bg-gray-200 px-1 rounded">X-Webhook-Signature</code> header.
                        Verify it using HMAC-SHA256 with your webhook secret.
                    </p>
                    <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
{`const crypto = require('crypto');

function verifySignature(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return signature === expected;
}`}
                    </pre>
                </CardContent>
            </Card>

            {/* Create Webhook Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Webhook</DialogTitle>
                        <DialogDescription>
                            Configure a webhook endpoint to receive event notifications
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                placeholder="e.g., Slack Notifications"
                                value={newWebhook.name}
                                onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label>Endpoint URL</Label>
                            <Input
                                type="url"
                                placeholder="https://your-server.com/webhook"
                                value={newWebhook.url}
                                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label className="mb-2 block">Events</Label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={newWebhook.events.includes('*')}
                                        onCheckedChange={() => toggleEvent('*')}
                                    />
                                    <span className="text-sm font-medium">All events</span>
                                </label>

                                {!newWebhook.events.includes('*') && (
                                    <div className="space-y-2 pl-2 border-l-2">
                                        {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
                                            <Collapsible key={key}>
                                                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                                                    <ChevronDown className="w-4 h-4" />
                                                    {category.label}
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pl-6 pt-2 space-y-1">
                                                    {category.events.map((event) => (
                                                        <label key={event} className="flex items-center gap-2">
                                                            <Checkbox
                                                                checked={newWebhook.events.includes(event)}
                                                                onCheckedChange={() => toggleEvent(event)}
                                                            />
                                                            <span className="text-sm font-mono">{event}</span>
                                                        </label>
                                                    ))}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createMutation.mutate(newWebhook)}
                            disabled={createMutation.isPending || !newWebhook.name || !newWebhook.url}
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Secret Dialog */}
            <Dialog open={showSecretDialog} onOpenChange={(open) => {
                setShowSecretDialog(open);
                if (!open) setNewSecret(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Webhook Secret</DialogTitle>
                        <DialogDescription>
                            Save this secret securely. You won't be able to see it again.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    Use this secret to verify webhook signatures. Store it securely!
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <Input
                                value={showSecret ? (newSecret || '') : '•'.repeat(40)}
                                readOnly
                                className="pr-20 font-mono text-sm"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSecret(!showSecret)}
                                >
                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => newSecret && copyToClipboard(newSecret)}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => {
                            setShowSecretDialog(false);
                            setNewSecret(null);
                        }}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
