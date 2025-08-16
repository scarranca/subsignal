'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { IntegrationCard } from '@/components/ui/integration-card';
import { apiClient } from '@/client/api';
import { toast } from 'sonner';

export function SettingsView() {
    const queryClient = useQueryClient();

    // TanStack Query for preferences data
    const { data: preferences, isLoading: loading } = useQuery({
        queryKey: ['preferences'],
        queryFn: async () => {
            const result = await apiClient.getPreferences();
            if (!result.success) {
                // If no preferences found (404), return null for new users
                if (result.error?.includes('not found')) {
                    return null;
                }
                throw new Error(result.error || 'Failed to load preferences');
            }
            return result.data;
        },
        staleTime: 30 * 1000, // 30 seconds
    });

    // Compute properties state from preferences
    const properties = preferences
        ? {
              pricing: preferences.properties.includes('pricing'),
              product: preferences.properties.includes('product'),
              customer: preferences.properties.includes('customer'),
              partnership: preferences.properties.includes('partnership'),
              branding: preferences.properties.includes('branding'),
              messaging: preferences.properties.includes('messaging'),
          }
        : {
              pricing: false,
              product: false,
              customer: false,
              partnership: false,
              branding: false,
              messaging: false,
          };

    const [localProperties, setLocalProperties] = useState(properties);
    const [frequency, setFrequency] = useState<
        '7_day' | '15_day' | '1_month' | '3_month' | '6_month'
    >(preferences?.frequency || '15_day');

    const hasPreferences = !!preferences;

    // Sync local state with server state when preferences load
    useEffect(() => {
        if (preferences) {
            const newProperties = {
                pricing: preferences.properties.includes('pricing'),
                product: preferences.properties.includes('product'),
                customer: preferences.properties.includes('customer'),
                partnership: preferences.properties.includes('partnership'),
                branding: preferences.properties.includes('branding'),
                messaging: preferences.properties.includes('messaging'),
            };
            setLocalProperties(newProperties);
            setFrequency(preferences.frequency);
        }
    }, [preferences]);

    const frequencyOptions = [
        { value: '7_day', label: '7 days' },
        { value: '15_day', label: '15 days' },
        { value: '1_month', label: '1 month' },
        { value: '3_month', label: '3 months' },
        { value: '6_month', label: '6 months' },
    ] as const;

    // Mutation for saving preferences
    const savePreferencesMutation = useMutation({
        mutationFn: async (data: {
            properties: (
                | 'pricing'
                | 'product'
                | 'customer'
                | 'partnership'
                | 'branding'
                | 'messaging'
            )[];
            frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month';
        }) => {
            const result = hasPreferences
                ? await apiClient.updatePreferences(data)
                : await apiClient.upsertPreferences(data);

            if (!result.success) {
                throw new Error(result.error || 'Failed to save preferences');
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['preferences'] });
            toast.success('Preferences saved successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Check if there are any changes
    const hasChanges = () => {
        const propertiesChanged = JSON.stringify(localProperties) !== JSON.stringify(properties);
        const frequencyChanged = frequency !== (preferences?.frequency || '15_day');
        return propertiesChanged || frequencyChanged;
    };

    const toggleProperty = (key: string) => {
        setLocalProperties((prev) => ({
            ...prev,
            [key]: !prev[key as keyof typeof prev],
        }));
    };

    const handleSave = async () => {
        // Convert properties object to array of enabled properties
        const enabledProperties = Object.entries(localProperties)
            .filter(([, enabled]) => enabled)
            .map(([property]) => property) as (
            | 'pricing'
            | 'product'
            | 'customer'
            | 'partnership'
            | 'branding'
            | 'messaging'
        )[];

        if (enabledProperties.length === 0) {
            toast.error('Please select at least one property to monitor');
            return;
        }

        savePreferencesMutation.mutate({
            properties: enabledProperties,
            frequency: frequency,
        });
    };

    if (loading) {
        return (
            <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading preferences...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen">
            <div className="max-w-4xl space-y-12">
                {/* Properties */}
                <div>
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Properties</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage your Properties</p>
                        </div>

                        {/* Save button - only show when there are changes */}
                        {hasChanges() && (
                            <Button
                                onClick={handleSave}
                                disabled={savePreferencesMutation.isPending}
                                size="sm"
                                className="bg-gray-900 hover:bg-gray-800 text-white"
                            >
                                {savePreferencesMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(localProperties).map(([key, checked]) => (
                            <div key={key} className="flex items-start space-x-3">
                                <Checkbox
                                    id={key}
                                    checked={checked}
                                    onCheckedChange={() => toggleProperty(key)}
                                    className="mt-0.5 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <div className="text-sm min-w-0 flex-1">
                                    <Label
                                        htmlFor={key}
                                        className="font-medium text-gray-900 capitalize cursor-pointer"
                                    >
                                        {key}
                                    </Label>
                                    <div className="text-gray-500">
                                        Spot changes in {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Frequency */}
                <div>
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900">Frequency</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage your Frequency</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Select
                                value={frequency}
                                onValueChange={(value: typeof frequency) => setFrequency(value)}
                            >
                                <SelectTrigger className="w-full sm:max-w-xs focus:ring-black focus:border-black">
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {frequencyOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Integrations */}
                <div>
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
                    </div>

                    <div className="space-y-6">
                        <IntegrationCard
                            title="Zapier"
                            description="Connect Subsignal to Zapier"
                            buttonText="Request"
                            onButtonClick={() =>
                                toast.success('Zapier integration requested, stay tuned!')
                            }
                        />
                        <IntegrationCard
                            title="Slack"
                            description="Connect Subsignal to Slack"
                            buttonText="Request"
                            onButtonClick={() =>
                                toast.success('Slack integration requested, stay tuned!')
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
