'use client';

import { useOnboardingStore } from '@/lib/stores/onboarding';
import { OnboardingContainer } from '../shared';
import { PricingComponent } from '../../PricingComponent';

interface OnboardingStepFiveProps {
    onComplete: () => void;
}

export const OnboardingStepFive = ({ onComplete }: OnboardingStepFiveProps) => {
    const { setCurrentStep } = useOnboardingStore();

    const handleCheckoutComplete = () => {
        // Set next step before continuing so user continues after payment
        setCurrentStep(5);
        // Also advance current flow
        onComplete();
    };

    return (
        <div className="w-full px-3 sm:px-4">
            <OnboardingContainer maxWidth="2xl">
                <PricingComponent
                    title="Choose Your Plan"
                    description="Select a plan that works best for you"
                    primaryButtonText={{
                        default: 'Get Started',
                        processing: 'Almost there...',
                        existing: 'Switch Plan',
                    }}
                    secondaryButtonText={{
                        existing: "I'm good",
                        new: 'I have a discount code',
                    }}
                    onCheckoutComplete={handleCheckoutComplete}
                    showSecondaryAction={true}
                    successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/get-started?step=5`}
                    cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/get-started?step=4`}
                />
            </OnboardingContainer>
        </div>
    );
};
