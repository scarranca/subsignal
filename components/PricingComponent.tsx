'use client';

import { useState, useEffect } from 'react';
import { PRICING_PLANS, PLAN_ID_MAPPING, type PlanType } from '@/constants/pricing';
import { SelectablePricingCard } from './onboarding/shared';

interface PaymentStatus {
    isPaying: boolean;
    currentPlan?: 'solo' | 'team';
    subscriptionId?: string;
    status?: string;
}

interface PricingComponentProps {
    /** Title for the pricing section */
    title?: string;
    /** Description for the pricing section */
    description?: string;
    /** Show in compact mode (e.g., for settings) */
    compact?: boolean;
    /** Show header button mode (button appears in header, only when plan changes) */
    headerButtonMode?: boolean;
    /** Custom button text for primary action */
    primaryButtonText?: {
        default: string;
        processing: string;
        existing: string;
    };
    /** Custom button text for secondary action */
    secondaryButtonText?: {
        existing: string;
        new: string;
    };
    /** Callback when checkout is completed */
    onCheckoutComplete?: () => void;
    /** Show secondary action button */
    showSecondaryAction?: boolean;
    /** Custom success and cancel URLs */
    successUrl?: string;
    cancelUrl?: string;
}

export const PricingComponent = ({
    title = 'Choose Your Plan',
    description = 'Select a plan that fits your needs',
    compact = false,
    headerButtonMode = false,
    primaryButtonText = {
        default: 'Get Started',
        processing: 'Processing...',
        existing: 'Switch Plan',
    },
    secondaryButtonText = {
        existing: 'Skip',
        new: 'I have a discount code',
    },
    onCheckoutComplete,
    showSecondaryAction = true,
    successUrl,
    cancelUrl,
}: PricingComponentProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('solo_plan');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    // Check payment status on component mount
    useEffect(() => {
        const checkPaymentStatus = async () => {
            try {
                const response = await fetch('/api/payments/status');
                const status = await response.json();
                setPaymentStatus(status);

                // If user is already paying, select their current plan
                if (status.isPaying && status.currentPlan) {
                    const planType = Object.entries(PLAN_ID_MAPPING).find(
                        ([, value]) => value === status.currentPlan,
                    )?.[0] as PlanType | undefined;
                    if (planType) {
                        setSelectedPlan(planType);
                    }
                }
            } catch (error) {
                console.error('Failed to check payment status:', error);
                // Default to non-paying user on error
                setPaymentStatus({ isPaying: false });
            } finally {
                setIsLoadingStatus(false);
            }
        };

        checkPaymentStatus();
    }, []);

    const handleCheckout = async () => {
        setIsProcessing(true);
        try {
            // Create checkout session with Dodo Payments
            const response = await fetch('/api/payments/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: PLAN_ID_MAPPING[selectedPlan],
                    successUrl: successUrl || `${window.location.origin}/get-started?step=5`,
                    cancelUrl: cancelUrl || `${window.location.origin}/get-started?step=4`,
                }),
            });

            const { checkoutUrl } = await response.json();

            if (checkoutUrl) {
                // Open checkout in new tab
                window.open(checkoutUrl, '_blank');
                // Call completion callback
                onCheckoutComplete?.();
            }
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSecondaryAction = () => {
        if (paymentStatus?.isPaying) {
            // For existing customers, just call the completion callback
            onCheckoutComplete?.();
        } else {
            // For new users, could open a discount code modal or handle differently
            handleCheckout();
        }
    };

    // Show loading state while checking payment status
    if (isLoadingStatus) {
        return (
            <div className="w-full">
                <div className={compact ? 'max-w-2xl' : 'max-w-4xl'}>
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="h-64 bg-gray-200 rounded"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const plans = PRICING_PLANS.map((plan) => ({
        ...plan,
        isCurrent:
            paymentStatus?.isPaying && paymentStatus?.currentPlan === PLAN_ID_MAPPING[plan.id],
        isPopular: plan.id === 'team_plan' && !paymentStatus?.isPaying, // Only show "Most Popular" for team plan if not paying
    }));

    // Check if user has changed their plan selection (for header button mode)
    const hasPlanChanged = () => {
        if (!paymentStatus?.isPaying || !paymentStatus.currentPlan) return false;
        const currentPlanType = Object.entries(PLAN_ID_MAPPING).find(
            ([, value]) => value === paymentStatus.currentPlan,
        )?.[0] as PlanType | undefined;
        return currentPlanType !== selectedPlan;
    };

    return (
        <div className="w-full">
            {/* Header */}
            {!compact && (
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-sm sm:text-base text-gray-600">{description}</p>
                </div>
            )}

            {compact && !headerButtonMode && (
                <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
            )}

            {compact && headerButtonMode && (
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                    </div>

                    {/* Header button - show when not paying or when plan has changed */}
                    {(!paymentStatus?.isPaying || hasPlanChanged()) && (
                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className="bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            {isProcessing
                                ? primaryButtonText.processing
                                : !paymentStatus?.isPaying
                                  ? 'Checkout'
                                  : primaryButtonText.existing}
                        </button>
                    )}
                </div>
            )}

            {/* Pricing Cards */}
            <div className={`mb-6 ${compact ? 'max-w-2xl' : 'max-w-4xl mx-auto'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                            isCurrent={plan.isCurrent}
                        />
                    ))}
                </div>
            </div>

            {/* Action Buttons - only show when not in header button mode */}
            {!headerButtonMode && (
                <div className={compact ? 'max-w-md' : 'max-w-sm mx-auto'}>
                    <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-md font-medium transition-colors mb-4"
                    >
                        {isProcessing
                            ? primaryButtonText.processing
                            : paymentStatus?.isPaying
                              ? primaryButtonText.existing
                              : primaryButtonText.default}
                    </button>

                    {showSecondaryAction && (
                        <div className="text-center">
                            <button
                                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                onClick={handleSecondaryAction}
                                disabled={isProcessing}
                            >
                                {paymentStatus?.isPaying
                                    ? secondaryButtonText.existing
                                    : secondaryButtonText.new}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
