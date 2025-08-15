'use client';

import { useState, useCallback } from 'react';
import { TrendingUp, Package, Users, Handshake, Palette, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEFAULT_PREFERENCES } from '@/constants/preferences';
import type { BatchCreateCompaniesResponse } from '@/client/api';

interface OnboardingStepTwoProps {
    onComplete: (
        properties: (
            | 'pricing'
            | 'product'
            | 'customer'
            | 'partnership'
            | 'branding'
            | 'messaging'
        )[],
    ) => void;
    onAdvance: () => void;
    isLoading: boolean;
    initialProperties?: (
        | 'pricing'
        | 'product'
        | 'customer'
        | 'partnership'
        | 'branding'
        | 'messaging'
    )[];
    batchResults?: BatchCreateCompaniesResponse;
}

const PROPERTY_OPTIONS = [
    {
        value: 'pricing' as const,
        label: 'Pricing',
        icon: TrendingUp,
    },
    {
        value: 'product' as const,
        label: 'Product',
        icon: Package,
    },
    {
        value: 'branding' as const,
        label: 'Branding',
        icon: Palette,
    },
    {
        value: 'messaging' as const,
        label: 'Messaging',
        icon: MessageSquare,
    },
    {
        value: 'customer' as const,
        label: 'Customer',
        icon: Users,
    },
    {
        value: 'partnership' as const,
        label: 'Partnership',
        icon: Handshake,
    },
];

export const OnboardingStepTwo = ({
    onComplete,
    onAdvance,
    initialProperties = DEFAULT_PREFERENCES.properties as (
        | 'pricing'
        | 'product'
        | 'customer'
        | 'partnership'
        | 'branding'
        | 'messaging'
    )[],
}: OnboardingStepTwoProps) => {
    const [selectedProperties, setSelectedProperties] =
        useState<NonNullable<typeof initialProperties>>(initialProperties);

    const toggleProperty = useCallback((property: NonNullable<typeof initialProperties>[0]) => {
        setSelectedProperties((prev: NonNullable<typeof initialProperties>) => {
            const newSelection = prev.includes(property)
                ? prev.filter((p: NonNullable<typeof initialProperties>[0]) => p !== property)
                : [...prev, property];

            // Only update local state - don't call parent during render
            return newSelection;
        });
    }, []);

    const handleContinue = () => {
        console.log('Step 2 - User clicked Continue with:', selectedProperties);
        onComplete(selectedProperties);
        onAdvance();
    };

    return (
        <div className="w-full max-w-sm mx-auto px-4">
            <div className="space-y-3">
                {PROPERTY_OPTIONS.map((option) => {
                    const isSelected = selectedProperties.includes(option.value);
                    const IconComponent = option.icon;

                    return (
                        <div
                            key={option.value}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleProperty(option.value)}
                        >
                            <div className="flex items-center gap-3">
                                <IconComponent className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-sm">{option.label}</span>
                            </div>
                            <div
                                className={`w-5 h-5 rounded border flex items-center justify-center ${
                                    isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                                }`}
                            >
                                {isSelected && (
                                    <svg
                                        className="w-3 h-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Continue button */}
            {selectedProperties.length > 0 && (
                <div className="mt-6">
                    <Button
                        onClick={handleContinue}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10"
                    >
                        Continue
                    </Button>
                </div>
            )}
        </div>
    );
};
