'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Signup route
 */
const signupRoute = '/signup';

export default function Hero() {
    const router = useRouter();

    // Handle Cmd/Ctrl + Enter shortcut for Get Started
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                router.push(signupRoute);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-16 md:py-24 space-y-16 md:space-y-24 relative">
            <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    <span className="block">Never Miss a Market Move</span>
                    <span className="block text-gray-500 mt-2">
                        Be The Investor Founders Turn to
                    </span>
                </h2>
                <p className="text-lg md:text-xl mb-10 mt-4 max-w-4xl mx-auto text-gray-600">
                    Monitor companies you passed on. Keep your sector thesis current
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                    <a href="#features">
                        <button className="bg-white text-black border border-gray-300 px-6 py-2.5 rounded-md font-medium hover:bg-gray-50 transition-colors">
                            View Demo
                        </button>
                    </a>
                    <Link href="/login">
                        <button className="bg-black text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                            <span>Get Started</span>
                            <span className="text-xs opacity-60">⌘↵</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Dashboard Preview */}
            <div className="w-full max-w-5xl rounded-lg overflow-hidden shadow-xl relative">
                <Image
                    src="/images/hero/dashboard.png"
                    alt="Integration platform dashboard showing API connections, metrics, and monitoring tools"
                    width={1024}
                    height={576}
                    className="w-full h-auto"
                    priority
                />

                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none opacity-70"></div>
            </div>
        </main>
    );
}
