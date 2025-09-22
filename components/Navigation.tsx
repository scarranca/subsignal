'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/client/auth';

/**
 * Signup route
 */
const signupRoute = '/get-started';

/**
 * Navigation component
 * @returns The navigation component
 */
export default function Navigation() {
    const router = useRouter();
    const { data: session, isPending: isLoading } = authClient.useSession();

    // Handle Cmd/Ctrl + Enter shortcut for Get Started/Dashboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (session?.user) {
                    router.push('/dashboard');
                } else {
                    router.push(signupRoute);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [router, session]);

    // Show loading state briefly
    if (isLoading) {
        return (
            <header className="sticky top-0 z-50 w-full py-4 px-6 md:px-12 flex justify-between items-center backdrop-blur-md">
                <Link
                    href="/"
                    className="font-semibold text-xl hover:opacity-80 transition-opacity font-lora"
                >
                    Subsignal
                </Link>
                <nav className="hidden md:flex space-x-8"></nav>
                <button
                    onClick={() => router.push(signupRoute)}
                    className="bg-black text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <span>Get Started</span>
                    <span className="text-xs opacity-60">⌘↵</span>
                </button>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 w-full py-4 px-6 md:px-12 flex justify-between items-center backdrop-blur-md">
            <Link
                href="/"
                className="font-semibold text-xl hover:opacity-80 transition-opacity font-lora"
            >
                Subsignal
            </Link>
            <nav className="hidden md:flex space-x-8"></nav>

            {session?.user ? (
                // Logged in: Show Dashboard button
                <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-black text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <span>Dashboard</span>
                    <span className="text-xs opacity-60">⌘↵</span>
                </button>
            ) : (
                // Not logged in: Show Get Started button
                <button
                    onClick={() => router.push(signupRoute)}
                    className="bg-black text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <span>Get Started</span>
                    <span className="text-xs opacity-60">⌘↵</span>
                </button>
            )}
        </header>
    );
}
