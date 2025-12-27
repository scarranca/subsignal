'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Search,
    Building2,
    User,
    Calendar,
    Sparkles,
    GripVertical,
    Loader2,
} from 'lucide-react';
import { apiClient } from '@/client';
import { toast } from 'sonner';
import { OrganizationOnboarding } from './OrganizationOnboarding';

interface DealsViewProps {
    onNavigate?: (view: string, params?: any) => void;
}

export function DealsView({ onNavigate }: DealsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDeal, setSelectedDeal] = useState<any>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const queryClient = useQueryClient();

    // Create deal form state
    const [newDealName, setNewDealName] = useState('');
    const [newDealValue, setNewDealValue] = useState('');
    const [newDealStageId, setNewDealStageId] = useState('');
    const [newDealCompanyId, setNewDealCompanyId] = useState('');
    const [newDealPriority, setNewDealPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [newDealExpectedClose, setNewDealExpectedClose] = useState('');

    // Check for organization
    const { data: orgData, isLoading: orgLoading } = useQuery({
        queryKey: ['current-organization'],
        queryFn: async () => {
            const res = await apiClient.get('/api/v1/organizations/current');
            if (!res.ok) return null;
            return res.json();
        },
    });

    // Fetch pipeline deals
    const { data: pipelineData, isLoading } = useQuery({
        queryKey: ['deals', 'pipeline'],
        queryFn: () => apiClient.get('/api/v1/deals/pipeline').then((res) => res.json()),
    });

    // Fetch companies for the create dialog
    const { data: companiesData } = useQuery({
        queryKey: ['companies', 'all'],
        queryFn: () => apiClient.get('/api/v1/companies?pageSize=100&sortBy=name&sortOrder=asc').then((res) => res.json()),
    });

    // Move deal mutation
    const moveDealMutation = useMutation({
        mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
            const res = await apiClient.post(`/api/v1/deals/${dealId}/move`, {
                body: JSON.stringify({ stageId }),
                headers: { 'Content-Type': 'application/json' },
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            toast.success('Deal moved successfully');
        },
        onError: () => {
            toast.error('Failed to move deal');
        },
    });

    // Generate AI insights mutation
    const generateInsightsMutation = useMutation({
        mutationFn: async (dealId: string) => {
            const res = await apiClient.post('/api/v1/ai/deals/insights', {
                body: JSON.stringify({ dealId }),
                headers: { 'Content-Type': 'application/json' },
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast.success('AI insights generated');
            setSelectedDeal((prev: any) => ({ ...prev, aiInsights: data }));
        },
        onError: () => {
            toast.error('Failed to generate insights');
        },
    });

    // Create deal mutation
    const createDealMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/api/v1/deals', {
                body: JSON.stringify({
                    name: newDealName,
                    value: newDealValue ? parseFloat(newDealValue) : 0,
                    stageId: newDealStageId,
                    priority: newDealPriority,
                    expectedCloseDate: newDealExpectedClose || null,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create deal');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            setShowCreateDialog(false);
            resetCreateForm();
            toast.success('Deal created successfully');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to create deal');
        },
    });

    const resetCreateForm = () => {
        setNewDealName('');
        setNewDealValue('');
        setNewDealStageId('');
        setNewDealPriority('medium');
        setNewDealExpectedClose('');
    };

    const formatCurrency = (value: string | number | null) => {
        if (!value) return '$0';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numValue);
    };

    const handleDragStart = (e: React.DragEvent, dealId: string) => {
        e.dataTransfer.setData('dealId', dealId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData('dealId');
        if (dealId) {
            moveDealMutation.mutate({ dealId, stageId });
        }
    };

    // Show loading state while checking organization
    if (orgLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Show onboarding if no organization
    if (!orgData) {
        return <OrganizationOnboarding />;
    }

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex-1 h-96 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
                    <p className="text-gray-500 mt-1">
                        {pipelineData?.totalDeals || 0} deals • {formatCurrency(pipelineData?.totalValue || 0)} total
                        value
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search deals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Deal
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-w-max pb-4">
                    {pipelineData?.stages?.map((stage: any) => (
                        <div
                            key={stage.id}
                            className="w-80 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            {/* Stage Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: stage.color }}
                                        />
                                        <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                            {stage.dealCount}
                                        </Badge>
                                    </div>
                                    <span className="text-sm text-gray-500">{formatCurrency(stage.totalValue)}</span>
                                </div>
                            </div>

                            {/* Deals List */}
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                {stage.deals
                                    ?.filter((deal: any) =>
                                        deal.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((deal: any) => (
                                        <Card
                                            key={deal.id}
                                            className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, deal.id)}
                                            onClick={() => setSelectedDeal(deal)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-2">
                                                    <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 cursor-grab" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {deal.name}
                                                        </h4>
                                                        {deal.company && (
                                                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                                <Building2 className="w-3 h-3" />
                                                                <span className="truncate">{deal.company.name}</span>
                                                            </div>
                                                        )}
                                                        {deal.contact && (
                                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                                <User className="w-3 h-3" />
                                                                <span className="truncate">
                                                                    {deal.contact.firstName} {deal.contact.lastName}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between mt-3">
                                                            <span className="font-semibold text-gray-900">
                                                                {formatCurrency(deal.value)}
                                                            </span>
                                                            {deal.expectedCloseDate && (
                                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(
                                                                        deal.expectedCloseDate
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {deal.aiScore && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${
                                                                            deal.aiScore >= 70
                                                                                ? 'bg-green-500'
                                                                                : deal.aiScore >= 40
                                                                                  ? 'bg-yellow-500'
                                                                                  : 'bg-red-500'
                                                                        }`}
                                                                        style={{ width: `${deal.aiScore}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {deal.aiScore}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                {stage.deals?.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <p className="text-sm">No deals in this stage</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Deal Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
                setShowCreateDialog(open);
                if (!open) resetCreateForm();
            }}>
                <DialogContent className="bg-white shadow-lg max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">Create New Deal</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Add a new deal to your pipeline
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dealName" className="text-sm font-medium text-gray-700">Deal Name</Label>
                            <Input
                                id="dealName"
                                placeholder="e.g., Enterprise contract"
                                value={newDealName}
                                onChange={(e) => setNewDealName(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dealValue" className="text-sm font-medium text-gray-700">Value ($)</Label>
                            <Input
                                id="dealValue"
                                type="number"
                                placeholder="0"
                                value={newDealValue}
                                onChange={(e) => setNewDealValue(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Stage</Label>
                            <Select value={newDealStageId} onValueChange={setNewDealStageId}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a stage" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {pipelineData?.stages?.map((stage: any) => (
                                        <SelectItem key={stage.id} value={stage.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: stage.color }}
                                                />
                                                {stage.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Priority</Label>
                            <Select value={newDealPriority} onValueChange={(v) => setNewDealPriority(v as typeof newDealPriority)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expectedClose" className="text-sm font-medium text-gray-700">Expected Close Date</Label>
                            <Input
                                id="expectedClose"
                                type="date"
                                value={newDealExpectedClose}
                                onChange={(e) => setNewDealExpectedClose(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="hover:bg-gray-50 w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createDealMutation.mutate()}
                            disabled={!newDealName || !newDealStageId || createDealMutation.isPending}
                            className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto"
                        >
                            {createDealMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            Create Deal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deal Detail Dialog */}
            <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedDeal && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl">{selectedDeal.name}</DialogTitle>
                                <DialogDescription>
                                    {selectedDeal.company?.name && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-4 h-4" />
                                            {selectedDeal.company.name}
                                        </span>
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Deal Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500">Value</label>
                                        <p className="text-lg font-semibold">{formatCurrency(selectedDeal.value)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Stage</label>
                                        <p className="text-lg font-semibold">{selectedDeal.stage?.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Expected Close</label>
                                        <p className="text-lg">
                                            {selectedDeal.expectedCloseDate
                                                ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString()
                                                : 'Not set'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Priority</label>
                                        <p className="text-lg capitalize">{selectedDeal.priority}</p>
                                    </div>
                                </div>

                                {/* AI Insights */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            AI Insights
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => generateInsightsMutation.mutate(selectedDeal.id)}
                                            disabled={generateInsightsMutation.isPending}
                                        >
                                            {generateInsightsMutation.isPending ? 'Generating...' : 'Generate Insights'}
                                        </Button>
                                    </div>

                                    {selectedDeal.aiSummary ? (
                                        <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                                            <p className="text-sm text-gray-700">{selectedDeal.aiSummary}</p>
                                            {selectedDeal.aiNextSteps && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                                        Next Steps:
                                                    </p>
                                                    <ul className="text-sm text-gray-700 space-y-1">
                                                        {selectedDeal.aiNextSteps
                                                            .split('\n')
                                                            .map((step: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2">
                                                                    <span className="text-indigo-600">•</span>
                                                                    {step}
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                                            No AI insights yet. Click "Generate Insights" to analyze this deal.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
