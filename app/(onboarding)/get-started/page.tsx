'use client';

import Image from 'next/image';
import { Testimonials } from '@/components/onboarding/Testimonials';
import { OnboardingStepIndicator } from '@/components/onboarding/OnboardingStepIndicator';
import { OnboardingNav } from '@/components/onboarding/OnboardingNav';
import { OnboardingSteps } from '@/components/onboarding/OnboardingSteps';
import { useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LOGIN_TESTIMONIALS } from '@/constants/testimonials';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

const testimonials = LOGIN_TESTIMONIALS;

const OnboardingContent = () => {
    const { currentStep, setCurrentStep } = useOnboardingStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    // Invalidate payment status cache when user navigates to get-started
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentStatus() });
    }, [queryClient]);

    // Handle URL step parameter (for payment redirects)
    useEffect(() => {
        const stepFromUrl = searchParams.get('step');
        if (stepFromUrl) {
            const stepNumber = parseInt(stepFromUrl, 10);
            if (stepNumber >= 1 && stepNumber <= 5) {
                setCurrentStep(stepNumber);
            }
        }
    }, [searchParams, setCurrentStep]);

    // Update URL when step changes
    useEffect(() => {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set('step', currentStep.toString());
        router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
    }, [currentStep, router, pathname, searchParams]);

    const handleNextStep = useCallback(() => {
        // If on last step, redirect to dashboard
        if (currentStep === 5) {
            window.location.href = '/dashboard';
            return;
        }

        // Skip payment step (4) if billing is not configured
        const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true';
        if (currentStep === 3 && !billingEnabled) {
            // Skip from step 3 directly to step 5 (complete)
            setCurrentStep(5);
            return;
        }

        // Advance to the next sequential step
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    }, [currentStep, setCurrentStep]);

    // Add keyboard shortcut for Cmd+Enter
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                handleNextStep();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleNextStep]);

    return (
        <>
            <OnboardingNav />
            <div className="flex flex-1 flex-col items-center justify-center min-h-screen">
                {/* Multi-step onboarding content */}
                <OnboardingSteps currentStep={currentStep} onNext={handleNextStep} />
            </div>

            {/* Step Indicator Dots */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <OnboardingStepIndicator currentStep={currentStep} totalSteps={5} />
            </div>
        </>
    );
};

const OnboardingPage = () => {
    return (
        <div className="flex min-h-screen">
            <div className="flex flex-1 flex-col bg-white relative">
                <Suspense
                    fallback={
                        <div className="flex flex-1 flex-col items-center justify-center">
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
                                <div className="h-64 bg-gray-200 rounded max-w-md mx-auto"></div>
                                <div className="flex justify-center space-x-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-gray-200"
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    }
                >
                    <OnboardingContent />
                </Suspense>
            </div>

            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden flex-col justify-start rounded-l-2xl">
                <div className="px-8 xl:px-16 pt-8 xl:pt-16 pb-4 w-full">
                    <Testimonials
                        testimonials={testimonials}
                        autoPlay={true}
                        interval={10000}
                        showNavigation={true}
                        className="w-full"
                    />
                </div>

                <div className="absolute bottom-0 right-0 w-full h-full flex items-end justify-end">
                    <div className="relative w-[75%] h-[60%] transform translate-x-[8%] translate-y-[8%]">
                        <Image
                            src="/images/auth/preview.png"
                            alt="Subsignal Preview"
                            fill
                            className="object-cover rounded-xl shadow-2xl object-left-top"
                            priority
                            sizes="(max-width: 1024px) 50vw, 40vw"
                            draggable={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
