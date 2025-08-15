'use client';

import { useState, useCallback } from 'react';
import { Calendar, CalendarDays, CalendarRange, Clock, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingStepThreeProps {
    onComplete: (frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month') => void;
    onAdvance: (frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month') => Promise<void>;
    isLoading: boolean;
    initialFrequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month';
    selectedProperties: (
        | 'pricing'
        | 'product'
        | 'customer'
        | 'partnership'
        | 'branding'
        | 'messaging'
    )[];
}

const FREQUENCY_OPTIONS = [
    {
        value: '7_day' as const,
        label: '7 Days',
        icon: Calendar,
    },
    {
        value: '15_day' as const,
        label: '15 Days',
        icon: CalendarDays,
    },
    {
        value: '1_month' as const,
        label: '1 Month',
        icon: CalendarRange,
    },
    {
        value: '3_month' as const,
        label: '3 Months',
        icon: Clock,
    },
    {
        value: '6_month' as const,
        label: '6 Months',
        icon: Timer,
    },
];

export const OnboardingStepThree = ({
    onComplete,
    onAdvance,
    isLoading,
    initialFrequency,
}: OnboardingStepThreeProps) => {
    const [selectedFrequency, setSelectedFrequency] =
        useState<typeof initialFrequency>(initialFrequency);

    const handleFrequencySelect = useCallback((frequency: typeof initialFrequency) => {
        setSelectedFrequency(frequency);
        // Only update local state - don't call parent during render
    }, []);

    const handleContinue = async () => {
        console.log('Step 3 - User clicked Continue with:', selectedFrequency);
        onComplete(selectedFrequency);
        await onAdvance(selectedFrequency);
    };

    return (
        <div className="w-full max-w-sm mx-auto px-4">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold mb-2 text-center font-lora">
                    Set your monitoring frequency
                </h1>
                <p className="text-base text-muted-foreground mb-6 text-center font-lora">
                    See every market move. Time your bets better
                </p>
            </div>
            <div className="space-y-3">
                {FREQUENCY_OPTIONS.map((option) => {
                    const isSelected = selectedFrequency === option.value;
                    return (
                        <div
                            key={option.value}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleFrequencySelect(option.value)}
                        >
                            <div className="flex items-center gap-3">
                                <option.icon className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-sm">{option.label}</span>
                            </div>
                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                                }`}
                            >
                                {isSelected && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Continue button */}
            <div className="mt-6">
                <Button
                    onClick={handleContinue}
                    disabled={isLoading}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10"
                >
                    {isLoading ? 'Saving...' : 'Continue'}
                </Button>
            </div>
        </div>
    );
};
