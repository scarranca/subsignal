'use client';

import { useState, useCallback, useEffect } from 'react';
import { PRICING_PLANS } from '@/constants/pricing';
import { AvailableBillingPlan, BillingPlan } from '@/db/schema/billing';
import { SelectablePricingCard } from './onboarding/shared';
import { apiClient } from '@/client/api';
import { showToast } from '@/lib/toast';
import { CAL_URL } from '@/constants/contact';
import { DelayedLink } from './ui/delayed-link';
import { PaymentStatus } from '@/types/api';

interface PaywallPricingProps {
    /** Title for the pricing section */
    title?: string;
    /** Description for the pricing section */
    description?: string;
    /** Custom button text */
    buttonText?: {
        default: string;
        processing: string;
        continue: string;
    };
    /** User email for checkout */
    userEmail: string;
    /** Current payment status (optional - if provided, component acts as plan switcher) */
    currentPaymentStatus?: PaymentStatus | null;
}

export const PaywallPricing = ({
    title = 'Choose Your Plan',
    description = 'Select a plan to continue',
    buttonText = {
        default: 'Get Started',
        processing: 'Almost there...',
        continue: 'Continue with Current Plan',
    },
    userEmail,
    currentPaymentStatus,
}: PaywallPricingProps) => {
    const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('solo_plan');
    const [isProcessing, setIsProcessing] = useState(false);

    // Set initial selected plan based on current subscription
    useEffect(() => {
        if (currentPaymentStatus?.plan) {
            setSelectedPlan(currentPaymentStatus.plan as AvailableBillingPlan);
        }
    }, [currentPaymentStatus]);

    // Check if user is switching to a different plan
    const isSwitchingPlan =
        currentPaymentStatus?.plan && currentPaymentStatus.plan !== selectedPlan;

    // Check if user has active subscription
    const hasActiveSubscription =
        currentPaymentStatus?.plan &&
        currentPaymentStatus.subscriptionId &&
        currentPaymentStatus.status === 'active';

    const handleAction = useCallback(async () => {
        // Helper function to handle errors and cleanup
        const handleError = (message: string) => {
            showToast.error(message);
            setIsProcessing(false);
        };

        // Helper function to redirect with subscription data
        const redirectToGetStarted = (subscriptionId?: string, status?: string) => {
            console.log('redirectToGetStarted', subscriptionId, status);
            const queryParams = new URLSearchParams({ step: '5' });

            if (subscriptionId) queryParams.set('subscription_id', subscriptionId);
            if (status) queryParams.set('status', status);

            window.location.href = `/get-started?${queryParams.toString()}`;
        };

        try {
            setIsProcessing(true);

            // Early return for missing user email
            if (!userEmail) {
                return handleError('Unable to load your account information. Please try again.');
            }

            // Route 1: Active subscription, not switching plans
            if (hasActiveSubscription && !isSwitchingPlan) {
                return redirectToGetStarted(
                    currentPaymentStatus.subscriptionId,
                    currentPaymentStatus.status,
                );
            }

            // Route 2: Active subscription, switching plans
            if (hasActiveSubscription && isSwitchingPlan) {
                const updateResponse = await apiClient.updateExistingSubscription({
                    planId: selectedPlan,
                });

                if (!updateResponse.success) {
                    return handleError(updateResponse.error || 'Failed to update subscription');
                }

                return redirectToGetStarted(updateResponse.data?.subscriptionId);
            }

            // Route 3: New subscription
            const checkoutResponse = await apiClient.createNewSubscription({
                planId: selectedPlan,
            });

            if (!checkoutResponse.success) {
                return handleError(checkoutResponse.error || 'Failed to create checkout session');
            }

            if (!checkoutResponse.data?.checkoutUrl) {
                return handleError('Failed to create checkout session');
            }

            window.location.href = checkoutResponse.data.checkoutUrl;
        } catch (error) {
            console.error('Checkout error:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to start checkout';
            handleError(errorMessage);
        }
    }, [selectedPlan, userEmail, hasActiveSubscription, isSwitchingPlan, currentPaymentStatus]);

    const plans = PRICING_PLANS.filter((plan) => plan.id !== 'custom_plan').map((plan) => ({
        ...plan,
        // isCurrent: currentPaymentStatus?.plan === plan.id, // Mark current plan
        isPopular: plan.id === 'team_plan', // Show team plan as popular
    }));

    // Determine button text based on current state
    const getButtonText = () => {
        if (isProcessing) {
            return buttonText.processing;
        }

        if (hasActiveSubscription && !isSwitchingPlan) {
            return buttonText.continue;
        }

        if (isSwitchingPlan) {
            return `Switch to ${plans.find((p) => p.id === selectedPlan)?.name || 'Selected Plan'}`;
        }

        return buttonText.default;
    };

    // Update title and description for plan switcher mode
    const getTitle = () => {
        if (hasActiveSubscription) {
            return isSwitchingPlan ? 'Switch Your Plan' : 'Your Current Plan';
        }
        return title;
    };

    const getDescription = () => {
        if (hasActiveSubscription) {
            return isSwitchingPlan
                ? 'Pick a plan that works best for you'
                : 'Continue or pick another plan';
        }
        return description;
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold mb-2 text-center font-lora">{getTitle()}</h2>
                <p className="text-base text-muted-foreground mb-6 text-center font-lora">
                    {getDescription()}
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                        <SelectablePricingCard
                            key={plan.id}
                            planName={plan.name}
                            price={plan.price}
                            period={plan.period}
                            description={plan.description}
                            features={plan.features}
                            isSelected={selectedPlan === plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            isPopular={plan.isPopular}
                            // isCurrent={plan.isCurrent}
                        />
                    ))}
                </div>
            </div>

            {/* Action Button */}
            <div className="max-w-sm mx-auto">
                <button
                    onClick={handleAction}
                    disabled={isProcessing}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {getButtonText()}
                </button>
            </div>

            {/* Secondary Button */}
            <div className="mt-4 text-center">
                <DelayedLink
                    href={CAL_URL}
                    delay={3000}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Need help? We&apos;re just a click away
                </DelayedLink>
            </div>
        </div>
    );
};
