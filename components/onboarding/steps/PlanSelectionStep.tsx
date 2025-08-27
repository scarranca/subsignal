'use client';

import { OnboardingContainer } from '../shared';
import { authClient } from '@/client/auth';
import { useEffect, useState } from 'react';

import apiClient from '@/client/api';
import { PaywallPricing } from '@/components/PaywallPricing';
import { PaymentStatus } from '@/types/api';

import PageSelectionStepSkeleton from '@/components/skeleton/skeleton-page-selection';

export const PlanSelectionStep = () => {
    const { data: session } = authClient.useSession();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    // Check payment status on component mount
    useEffect(() => {
        const checkPaymentStatus = async () => {
            try {
                const response = await apiClient.getPaymentStatus();

                if (response.success && response.data) {
                    setPaymentStatus(response.data);
                } else {
                    setPaymentStatus({
                        ...(response.data && {
                            userName: response.data.userName,
                            userEmail: response.data.userEmail,
                        }),
                    });
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            } finally {
                setIsLoadingStatus(false);
            }
        };

        checkPaymentStatus();
    }, []);

    // Show loading state while checking payment status
    if (isLoadingStatus) {
        return <PageSelectionStepSkeleton />;
    }

    // Always show the PaywallPricing component - it will handle both scenarios
    return (
        <div className="w-full px-3 sm:px-4">
            <OnboardingContainer maxWidth="2xl">
                <PaywallPricing
                    title="Choose Your Plan"
                    description="Select a plan to complete your setup"
                    buttonText={{
                        default: 'Subscribe',
                        processing: 'Almost there...',
                        continue: 'Continue to Next Step',
                    }}
                    userEmail={session?.user?.email || ''}
                    currentPaymentStatus={paymentStatus}
                />
            </OnboardingContainer>
        </div>
    );
};
