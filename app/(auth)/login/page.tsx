'use client';

import { Button } from '@/components/ui/button';
import { TermsCheckbox } from '@/components/ui/terms-checkbox';
import Image from 'next/image';
import Link from 'next/link';
import { Testimonials } from '@/components/onboarding/Testimonials';
import { useState, useEffect, useCallback } from 'react';
import { showToast } from '@/lib/toast';
import { LOGIN_TESTIMONIALS } from '@/constants/testimonials';
import { authClient } from '@/client/auth';

const testimonials = LOGIN_TESTIMONIALS;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(true); // Default to checked

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        if (!agreedToTerms) {
            showToast.error('Please agree to the Terms of Service and Privacy Policy to continue.');
            return;
        }

        setLoading(true);

        try {
            const response = await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/dashboard',
                fetchOptions: {
                    onError: (error) => {
                        console.error('Error signing in with Google:', error);
                        showToast.error('Failed to sign in with Google. Please try again.');
                        setLoading(false);
                    },
                },
            });

            // Check for error in response
            if (response?.error) {
                throw new Error(response.error.message || 'Authentication failed');
            }

            // Check for URL in data property
            if (response?.data?.url) {
                window.location.href = response.data.url;
                return;
            }

            // If no URL is returned, something went wrong
            const errorMessage = 'Failed to get Google OAuth URL. Please try again.';
            console.error(errorMessage);
            showToast.error(errorMessage);
            setLoading(false);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to sign in with Google. Please try again.';
            console.error(errorMessage);
            showToast.error(errorMessage);
            setLoading(false);
        }
    }, [agreedToTerms]);

    // Add keyboard shortcut for Cmd+Enter
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key === 'Enter' &&
                !loading &&
                agreedToTerms
            ) {
                event.preventDefault();
                signInWithGoogle();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [loading, agreedToTerms, signInWithGoogle]);

    return (
        <div className="flex min-h-screen">
            <div className="flex flex-1 flex-col bg-white relative">
                <nav className="absolute top-0 left-0 w-full flex items-center h-20 px-8">
                    <Link href="/" className="text-xl font-semibold font-lora">
                        Subsignal
                    </Link>
                </nav>
                <div className="flex flex-1 flex-col items-center justify-center min-h-screen">
                    <div className="w-full max-w-sm flex flex-col items-center">
                        <h1 className="text-2xl font-semibold mb-2 text-center font-lora">
                            Let&apos;s get you signed in
                        </h1>
                        <p className="text-base text-muted-foreground mb-6 text-center font-lora">
                            Quick auth and we&apos;ll get you on your way
                        </p>
                        <Button
                            onClick={signInWithGoogle}
                            disabled={loading || !agreedToTerms}
                            className={`w-full h-10 text-base font-normal justify-center mt-2 ${
                                !agreedToTerms ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            variant="outline"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Connecting...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Login with Google
                                </div>
                            )}
                        </Button>

                        {/* Terms and Privacy Policy Checkbox */}
                        <TermsCheckbox
                            checked={agreedToTerms}
                            onChange={setAgreedToTerms}
                            mode="login"
                        />

                        <div className="mt-4 text-center">
                            <div className="flex justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">⌘</kbd>
                                    <span>+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">↵</kbd>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center px-4">
                        <p className="text-sm text-muted-foreground">
                            New user?{' '}
                            <Link
                                href="/signup"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
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

export default LoginPage;
