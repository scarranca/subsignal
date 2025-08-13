'use client';

import { useState } from 'react';
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

export function SettingsView() {
    const [properties, setProperties] = useState({
        pricing: true,
        positioning: true,
        partnerships: true,
        branding: true,
        customer: true,
        messaging: true,
    });

    const [frequency, setFrequency] = useState('15'); // Changed to string for Select component

    const frequencyOptions = [
        { value: '7', label: '7 days' },
        { value: '15', label: '15 days' },
        { value: '30', label: '1 month' },
        { value: '90', label: '3 month' },
        { value: '180', label: '6 month' },
    ];

    const toggleProperty = (key: string) => {
        setProperties((prev) => ({
            ...prev,
            [key]: !prev[key as keyof typeof prev],
        }));
    };

    return (
        <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen">
            <div className="max-w-4xl space-y-12">
                {/* Properties */}
                <div>
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900">Properties</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage your Properties</p>
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
                            <Select value={frequency} onValueChange={setFrequency}>
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
