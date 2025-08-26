'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/client/auth';
import { AVATAR_COLORS, AVATAR_VARIANT } from '@/constants/palette';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import BoringAvatar from 'boring-avatars';
import confetti from 'canvas-confetti';
import { useOnboardingStore } from '@/lib/stores/onboarding';

interface OnboardingCompleteStepProps {
    onComplete: () => void;
    companiesCreated: number;
}

export const OnboardingCompleteStep = ({ onComplete }: OnboardingCompleteStepProps) => {
    const { data: session, isPending } = authClient.useSession();
    const { resetStep } = useOnboardingStore();
    const userName = session?.user?.name || 'Anonymous User';
    const userEmail = session?.user?.email || 'user@example.com';
    const [showStartOver, setShowStartOver] = useState(false);

    // Trigger confetti when component mounts
    useEffect(() => {
        const triggerConfetti = () => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        };

        // Small delay to let the component render
        const timer = setTimeout(triggerConfetti, 300);
        return () => clearTimeout(timer);
    }, []);

    // Show "Start over" button after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowStartOver(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleGoToDashboard = () => {
        onComplete();
        window.location.href = '/dashboard';
    };

    const handleStartOver = () => {
        resetStep();
    };

    // Loading state
    if (isPending) {
        return (
            <div className="w-full max-w-xs mx-auto px-4 text-center">
                <div className="mb-6">
                    {/* Skeleton avatar */}
                    <div className="w-[60px] h-[60px] bg-gray-200 rounded-full mx-auto mb-3 animate-pulse" />

                    {/* Skeleton text */}
                    <div className="h-6 bg-gray-200 rounded mx-auto mb-1 w-32 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded mx-auto w-40 animate-pulse" />
                </div>

                {/* Skeleton button */}
                <div className="mt-6">
                    <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xs mx-auto px-4 text-center">
            <div className="mb-6">
                <BoringAvatar
                    name={userName}
                    colors={AVATAR_COLORS}
                    variant={AVATAR_VARIANT}
                    size={60}
                    className="mx-auto mb-3"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{userName}</h3>
                <p className="text-sm text-gray-600">{userEmail}</p>
            </div>

            {/* Dashboard button */}
            <div className="mt-6">
                <Button
                    onClick={handleGoToDashboard}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10"
                >
                    Dashboard
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>

                {/* Start over button - fades in after 3 seconds */}
                <button
                    onClick={handleStartOver}
                    className={`w-full mt-3 text-xs text-gray-500 hover:text-gray-700 transition-all duration-500 ${
                        showStartOver ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                >
                    Start over
                </button>
            </div>
        </div>
    );
};
