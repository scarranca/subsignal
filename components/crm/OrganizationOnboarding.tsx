'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Building2,
    Users,
    Loader2,
    ArrowRight,
    Check,
    Target,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationOnboardingProps {
    onComplete?: () => void;
}

export function OrganizationOnboarding({ onComplete }: OrganizationOnboardingProps) {
    const queryClient = useQueryClient();
    const [orgName, setOrgName] = useState('');
    const [step, setStep] = useState<'welcome' | 'create'>('welcome');

    const createOrgMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/api/v1/organizations', {
                body: JSON.stringify({ name: orgName }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create organization');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-organization'] });
            toast.success('Organization created successfully!');
            onComplete?.();
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to create organization');
        },
    });

    const features = [
        {
            icon: Users,
            title: 'Team Collaboration',
            description: 'Invite team members and manage roles',
        },
        {
            icon: Target,
            title: 'Shared Pipeline',
            description: 'Track deals and tasks together',
        },
        {
            icon: Sparkles,
            title: 'AI-Powered Insights',
            description: 'Get intelligent recommendations for your team',
        },
    ];

    if (step === 'welcome') {
        return (
            <div className="min-h-[600px] flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-lg space-y-8">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome to Subsignal CRM
                        </h1>
                        <p className="text-gray-500">
                            Create your workspace to start managing deals, contacts, and team
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <feature.icon className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{feature.title}</h3>
                                    <p className="text-sm text-gray-500">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Button
                        onClick={() => setStep('create')}
                        className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                        Get Started
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-lg space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Create Your Workspace
                    </h1>
                    <p className="text-gray-500">
                        Give your organization a name to get started
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="orgName" className="text-sm font-medium">
                            Organization Name
                        </Label>
                        <Input
                            id="orgName"
                            placeholder="e.g., Acme Corp, My Team, Sales Team"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="h-12 text-base"
                            autoFocus
                        />
                        <p className="text-xs text-gray-400">
                            You can change this anytime in settings
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setStep('welcome')}
                            className="flex-1 h-12"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={() => createOrgMutation.mutate()}
                            disabled={!orgName.trim() || createOrgMutation.isPending}
                            className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                            {createOrgMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 w-5 h-5" />
                                    Create Workspace
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Help text */}
                <p className="text-center text-sm text-gray-400">
                    After creating your workspace, you can invite team members and start tracking deals
                </p>
            </div>
        </div>
    );
}
