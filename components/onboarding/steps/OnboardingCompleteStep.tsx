'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/client/auth';
import { AVATAR_COLORS, AVATAR_VARIANT } from '@/constants/palette';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import BoringAvatar from 'boring-avatars';
import confetti from 'canvas-confetti';

import { apiClient } from '@/client/api';
import { showToast } from '@/lib/toast';

export const OnboardingCompleteStep = () => {
    const { data: session, isPending } = authClient.useSession();
    const searchParams = useSearchParams();
    const userName = session?.user?.name || 'Anonymous User';
    const userEmail = session?.user?.email || 'user@example.com';

    const [isValidatingPayment, setIsValidatingPayment] = useState(false);
    const [buttonConfig, setButtonConfig] = useState({
        text: 'Dashboard',
        destination: '/dashboard',
    });

    // Get URL parameters
    const subscriptionId = searchParams.get('subscription_id');

    // Validate payment status when component mounts
    useEffect(() => {
        const validatePayment = async () => {
            if (!subscriptionId) {
                // No payment validation needed, show confetti immediately
                showToast.error('Payment validation failed. Please try again.');
                setButtonConfig({
                    text: 'Checkout',
                    destination: '/get-started?step=4',
                });
                return;
            }

            setIsValidatingPayment(true);
            try {
                const response = await apiClient.validatePaymentStatus({
                    subscription_id: subscriptionId,
                });

                console.log('validatePaymentStatus', response);

                if (response.success && response.data?.isValid) {
                    // Payment is valid, show confetti and set dashboard button
                    triggerConfetti();
                    showToast.success('Payment validated successfully!');
                    setButtonConfig({
                        text: 'Dashboard',
                        destination: '/dashboard',
                    });
                } else {
                    // Payment validation failed, show error toast and set checkout button
                    showToast.error('Payment validation failed. Please try again.');
                    setButtonConfig({
                        text: 'Checkout',
                        destination: '/get-started?step=4',
                    });
                }
            } catch (error) {
                console.error('Payment validation error:', error);
                showToast.error('Payment validation failed. Please try again.');
                setButtonConfig({
                    text: 'Checkout',
                    destination: '/get-started?step=4',
                });
            } finally {
                setIsValidatingPayment(false);
            }
        };

        validatePayment();
    }, [subscriptionId]);

    // Trigger confetti function
    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
        });
    };

    const handleButtonClick = () => {
        window.location.href = buttonConfig.destination;
    };

    // Only show user skeleton while session is loading
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
            {/* User profile - shows immediately once session loads */}
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

            {/* Button area - shows skeleton only during payment validation */}
            <div className="mt-6">
                {isValidatingPayment ? (
                    <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse" />
                ) : (
                    <Button
                        onClick={handleButtonClick}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10"
                    >
                        {buttonConfig.text}
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};
