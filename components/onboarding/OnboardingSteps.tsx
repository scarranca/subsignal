'use client';

import { useState, useEffect } from 'react';
import { OnboardingStepOne } from './steps/OnboardingStepOne';
import { OnboardingStepTwo } from './steps/OnboardingStepTwo';
import { OnboardingStepThree } from './steps/OnboardingStepThree';
import { OnboardingStepFour } from './steps/OnboardingStepFour';
import { apiClient } from '@/client/api';
import type { BatchCreateCompaniesResponse } from '@/client/api';
import { toast } from 'sonner';

interface OnboardingStepsProps {
    currentStep: number;
    onNext: () => void;
}

export interface OnboardingData {
    urls: string[];
    properties: ('pricing' | 'product' | 'customer' | 'partnership' | 'branding' | 'messaging')[];
    frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month';
    batchResults?: BatchCreateCompaniesResponse;
}

export const OnboardingSteps = ({ currentStep, onNext }: OnboardingStepsProps) => {
    const [data, setData] = useState<OnboardingData>({
        urls: [],
        properties: ['product', 'customer', 'messaging'],
        frequency: '7_day',
    });

    console.log('OnboardingSteps - Current data:', data);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const updateData = (updates: Partial<OnboardingData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    // Fetch existing user data on component mount
    useEffect(() => {
        const fetchExistingData = async () => {
            try {
                console.log('Fetching existing user data...');

                // Fetch existing companies
                const companiesResponse = await apiClient.getCompanies({ pageSize: 50 });
                let existingUrls: string[] = [];

                if (companiesResponse.success && companiesResponse.data) {
                    existingUrls = companiesResponse.data.data.map((company) => company.url);
                    console.log('Found existing companies:', existingUrls);
                } else {
                    console.log(
                        'No existing companies found or API error:',
                        companiesResponse.error,
                    );
                }

                // Fetch existing preferences
                const preferencesResponse = await apiClient.getPreferences();
                let existingProperties: OnboardingData['properties'] = [
                    'product',
                    'customer',
                    'messaging',
                ];
                let existingFrequency: OnboardingData['frequency'] = '7_day';

                if (preferencesResponse.success && preferencesResponse.data) {
                    existingProperties = preferencesResponse.data.properties;
                    existingFrequency = preferencesResponse.data.frequency;
                    console.log('Found existing preferences:', {
                        properties: existingProperties,
                        frequency: existingFrequency,
                    });
                } else {
                    console.log(
                        'No existing preferences found or API error:',
                        preferencesResponse.error,
                    );
                }

                // Update state with fetched data
                updateData({
                    urls: existingUrls,
                    properties: existingProperties,
                    frequency: existingFrequency,
                });
            } catch (error) {
                console.error('Error fetching existing data:', error);
                // Don't block onboarding if data fetch fails, just use defaults
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchExistingData();
    }, []);

    const handleStep1Update = (urls: string[]) => {
        updateData({ urls });
    };

    const handleAdvanceFromStep1 = async (urls?: string[]) => {
        const urlsToUse = urls || data.urls;
        setIsLoading(true);
        try {
            console.log('Sending URLs to API:', urlsToUse);
            const response = await apiClient.batchCreateCompanies({ urls: urlsToUse });
            if (response.success && response.data) {
                updateData({ urls: urlsToUse, batchResults: response.data });
                console.log('Batch create summary:', response.data.summary);
                if (response.data.summary.skipped && response.data.summary.skipped > 0) {
                    console.log(`Skipped ${response.data.summary.skipped} existing companies`);
                }
                onNext();
            } else {
                console.error('Failed to create companies:', response.error);
                toast.error('Failed to create companies. Please try again.');
            }
        } catch (error) {
            console.error('Error creating companies:', error);
            toast.error('An error occurred while creating companies.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2Update = (properties: OnboardingData['properties']) => {
        console.log('Step 2 - Updating properties:', properties);
        updateData({ properties });
    };

    const handleStep3Update = (frequency: OnboardingData['frequency']) => {
        console.log('Step 3 - Updating frequency:', frequency);
        updateData({ frequency });
    };

    const handleAdvanceFromStep3 = async (frequency?: OnboardingData['frequency']) => {
        const frequencyToUse = frequency || data.frequency;
        setIsLoading(true);
        try {
            console.log('Step 3 - Sending preferences to API:', {
                properties: data.properties,
                frequency: frequencyToUse,
            });

            const response = await apiClient.updatePreferences({
                properties: data.properties,
                frequency: frequencyToUse,
            });

            if (response.success) {
                console.log('Preferences updated successfully');
                updateData({ frequency: frequencyToUse });
                onNext();
            } else {
                console.error('Failed to update preferences:', response.error);
                toast.error('Failed to update preferences. Please try again.');
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            toast.error('An error occurred while updating preferences.');
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state while fetching initial data
    if (isInitialLoading) {
        return (
            <div className="w-full max-w-sm mx-auto px-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading your data...</p>
            </div>
        );
    }

    switch (currentStep) {
        case 1:
            return (
                <OnboardingStepOne
                    onComplete={handleStep1Update}
                    onAdvance={handleAdvanceFromStep1}
                    isLoading={isLoading}
                    initialUrls={data.urls}
                />
            );
        case 2:
            return (
                <OnboardingStepTwo
                    onComplete={handleStep2Update}
                    onAdvance={onNext}
                    isLoading={isLoading}
                    initialProperties={data.properties}
                    batchResults={data.batchResults}
                />
            );
        case 3:
            return (
                <OnboardingStepThree
                    onComplete={handleStep3Update}
                    onAdvance={handleAdvanceFromStep3}
                    isLoading={isLoading}
                    initialFrequency={data.frequency}
                    selectedProperties={data.properties}
                />
            );
        case 4:
            return (
                <OnboardingStepFour
                    onComplete={onNext}
                    companiesCreated={data.batchResults?.summary.successful || 0}
                />
            );
        default:
            return null;
    }
};
