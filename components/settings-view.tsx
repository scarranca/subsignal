'use client';

import { useState, useEffect } from 'react';
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
import { apiClient } from '@/client/api';
import { toast } from 'sonner';

export function SettingsView() {
    const [properties, setProperties] = useState({
        pricing: false,
        product: false,
        customer: false,
        partnership: false,
        branding: false,
        messaging: false,
    });

    const [originalProperties, setOriginalProperties] = useState({
        pricing: false,
        product: false,
        customer: false,
        partnership: false,
        branding: false,
        messaging: false,
    });

    const [frequency, setFrequency] = useState<
        '7_day' | '15_day' | '1_month' | '3_month' | '6_month'
    >('15_day');
    const [originalFrequency, setOriginalFrequency] = useState<
        '7_day' | '15_day' | '1_month' | '3_month' | '6_month'
    >('15_day');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasPreferences, setHasPreferences] = useState(false);

    const frequencyOptions = [
        { value: '7_day', label: '7 days' },
        { value: '15_day', label: '15 days' },
        { value: '1_month', label: '1 month' },
        { value: '3_month', label: '3 months' },
        { value: '6_month', label: '6 months' },
    ] as const;

    // Load preferences on component mount
    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const result = await apiClient.getPreferences();

            if (result.success && result.data) {
                const preference = result.data;

                // Convert array of properties to object with boolean values
                const propertiesObj = {
                    pricing: preference.properties.includes('pricing'),
                    product: preference.properties.includes('product'),
                    customer: preference.properties.includes('customer'),
                    partnership: preference.properties.includes('partnership'),
                    branding: preference.properties.includes('branding'),
                    messaging: preference.properties.includes('messaging'),
                };

                setProperties(propertiesObj);
                setOriginalProperties(propertiesObj);
                setFrequency(preference.frequency);
                setOriginalFrequency(preference.frequency);
                setHasPreferences(true);
            } else {
                // If no preferences found (404), that's expected for new users
                if (result.error?.includes('not found')) {
                    setHasPreferences(false);
                } else {
                    toast.error(result.error || 'Failed to load preferences');
                }
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            toast.error('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    // Check if there are any changes
    const hasChanges = () => {
        const propertiesChanged = JSON.stringify(properties) !== JSON.stringify(originalProperties);
        const frequencyChanged = frequency !== originalFrequency;
        return propertiesChanged || frequencyChanged;
    };

    const toggleProperty = (key: string) => {
        setProperties((prev) => ({
            ...prev,
            [key]: !prev[key as keyof typeof prev],
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Convert properties object to array of enabled properties
            const enabledProperties = Object.entries(properties)
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

            const requestData = {
                properties: enabledProperties,
                frequency: frequency,
            };

            const result = hasPreferences
                ? await apiClient.updatePreferences(requestData)
                : await apiClient.upsertPreferences(requestData);

            if (result.success) {
                setHasPreferences(true);
                setOriginalProperties(properties);
                setOriginalFrequency(frequency);
                toast.success('Preferences saved successfully');
            } else {
                toast.error(result.error || 'Failed to save preferences');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences');
        } finally {
            setSaving(false);
        }
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
                                disabled={saving}
                                size="sm"
                                className="bg-gray-900 hover:bg-gray-800 text-white"
                            >
                                {saving ? (
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
                        {Object.entries(properties).map(([key, checked]) => (
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

                    <div className="bg-gray-50 rounded-lg p-4 max-w-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Zapier</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Connect Subsignal to Zapier
                                </p>
                            </div>
                            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                                Connect
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
