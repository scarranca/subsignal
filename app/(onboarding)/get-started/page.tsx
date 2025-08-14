'use client';

import Image from 'next/image';
import { Testimonials } from '@/components/onboarding/Testimonials';
import { OnboardingStepIndicator } from '@/components/onboarding/OnboardingStepIndicator';
import { OnboardingNav } from '@/components/onboarding/OnboardingNav';
import { useState, useEffect, useCallback } from 'react';
import { LOGIN_TESTIMONIALS } from '@/constants/testimonials';

const testimonials = LOGIN_TESTIMONIALS;

const OnboardingPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [nextStep, setNextStep] = useState(2);

    const handleNextStep = useCallback(() => {
        // If on last step, redirect to dashboard
        if (currentStep === 4) {
            window.location.href = '/dashboard';
            return;
        }

        // Advance to the next sequential step
        if (nextStep <= 4) {
            setCurrentStep(nextStep);
            setNextStep(nextStep + 1);
        }
    }, [currentStep, nextStep]);

    const handleStepClick = (step: number) => {
        setCurrentStep(step);
        setNextStep(step + 1);
    };

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
        <div className="flex min-h-screen">
            <div className="flex flex-1 flex-col bg-white relative">
                <OnboardingNav currentStep={currentStep} onNext={handleNextStep} />
                <div className="flex flex-1 flex-col items-center justify-center min-h-screen">
                    {/* Left Side Content */}
                </div>

                {/* Step Indicator Dots */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <OnboardingStepIndicator
                        currentStep={currentStep}
                        totalSteps={4}
                        onStepClick={handleStepClick}
                    />
                </div>
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
                            src="/images/auth/preview.svg"
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
