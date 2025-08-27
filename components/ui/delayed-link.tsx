'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DelayedLinkProps {
    /** URL for the link */
    href: string;
    /** Text to display */
    children: React.ReactNode;
    /** Delay in milliseconds before showing the link */
    delay?: number;
    /** Additional CSS classes */
    className?: string;
    /** Link CSS classes */
    linkClassName?: string;
}

export const DelayedLink = ({
    href,
    children,
    delay = 5000,
    className = 'text-center mt-4 w-full text-xs text-gray-500 hover:text-gray-700 transition-all duration-500',
    linkClassName = 'text-sm text-gray-600 hover:text-gray-800 transition-colors',
}: DelayedLinkProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={`${className} ${
                isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            <Link href={href} className={linkClassName}>
                {children}
            </Link>
        </div>
    );
};
