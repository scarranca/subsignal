'use client';

import { AlignJustify, ChevronRight, LogIn, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/logo';
import { authClient } from '@/client/auth';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { useEffect, useState } from 'react';

/**
 * Feature flag to show GitHub link instead of Dashboard/Get Started
 */
const SHOW_GITHUB_LINK = true;

function DrawerNavLink({
    href,
    children,
    icon,
    onClick,
    isButton = false,
    className = '',
}: {
    href: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    isButton?: boolean;
    className?: string;
}) {
    if (isButton) {
        return (
            <Button
                asChild
                className={`rounded-full border-[0.5px] hover:brightness-99 ${className}`}
                onClick={onClick}
                variant="secondary"
            >
                <Link className="flex items-center gap-2 px-5 py-5 font-medium" href={href}>
                    {icon}
                    {children}
                </Link>
            </Button>
        );
    }
    return (
        <Link
            className={`flex w-full items-center gap-2 rounded-lg py-2 opacity-60 transition-opacity hover:opacity-100 ${className}`}
            href={href}
            onClick={onClick}
            tabIndex={0}
        >
            {icon}
            {children}
        </Link>
    );
}

export default function Header() {
    const { data: session, isPending } = authClient.useSession();
    const user = session?.user;
    const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || '';
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="mx-auto mt-12 flex w-full max-w-7xl flex-wrap items-center justify-between gap-8 p-4 font-inter text-sm">
            <div className="flex flex-1 flex-shrink-0 items-center justify-start gap-2">
                <Logo />
            </div>

            <div className="hidden items-center gap-8 md:flex">
                <Link
                    className="text-sm opacity-70 transition-opacity hover:opacity-100"
                    href={`${baseUrl}/`}
                >
                    Home
                </Link>
                <Link
                    className="text-sm opacity-70 transition-opacity hover:opacity-100"
                    href={`${baseUrl}/?#features`}
                >
                    Features
                </Link>
                <Link
                    className="text-sm opacity-70 transition-opacity hover:opacity-100"
                    href={`${baseUrl}/?#pricing`}
                >
                    Pricing
                </Link>
                <Link
                    className="text-sm opacity-70 transition-opacity hover:opacity-100"
                    href={`${baseUrl}/roadmap`}
                >
                    Roadmap
                </Link>
            </div>

            <div className="hidden flex-1 justify-end gap-1 md:flex">
                {SHOW_GITHUB_LINK ? (
                    <Button
                        asChild
                        className="rounded-full border-[0.5px] hover:brightness-99"
                        variant="secondary"
                    >
                        <a
                            className="flex items-center gap-2 px-5 py-5 font-medium"
                            href="https://github.com/wizenheimer/subsignal"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                            <ChevronRight />
                        </a>
                    </Button>
                ) : mounted && !isPending && user ? (
                    <Button
                        asChild
                        className="rounded-full border-[0.5px] hover:brightness-99"
                        variant="secondary"
                    >
                        <Link
                            className="flex items-center gap-2 px-5 py-5 font-medium"
                            href={`${baseUrl}/dashboard`}
                        >
                            Dashboard
                            <ChevronRight />
                        </Link>
                    </Button>
                ) : (
                    <Button
                        asChild
                        className="rounded-full border-[0.5px] hover:brightness-99"
                        variant="secondary"
                    >
                        <Link
                            className="flex items-center gap-2 px-5 py-5 font-medium"
                            href={`${baseUrl}/signup`}
                        >
                            Get Started
                        </Link>
                    </Button>
                )}
            </div>

            <div className="flex items-center md:hidden">
                <Drawer>
                    <DrawerTrigger asChild>
                        <Button aria-label="open-sidebar" size="icon" variant="ghost">
                            <span className="sr-only">Open sidebar</span>
                            <AlignJustify className="h-6 w-6" />
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent className="flex flex-col gap-6 p-6 pt-10">
                        <div className="sr-only">
                            <DrawerTitle>Navigation Menu</DrawerTitle>
                        </div>
                        <div className="sr-only">
                            <DrawerDescription>
                                Main navigation links and user actions for Subsignal.
                            </DrawerDescription>
                        </div>
                        <div className="flex w-full flex-col items-center gap-4">
                            <nav className="flex w-full flex-col">
                                <DrawerNavLink href={`${baseUrl}/`}>Home</DrawerNavLink>
                                <DrawerNavLink href={`${baseUrl}/?#features`}>
                                    Features
                                </DrawerNavLink>
                                <DrawerNavLink href={`${baseUrl}/?#pricing`}>Pricing</DrawerNavLink>
                                <DrawerNavLink href={`${baseUrl}/roadmap`}>Roadmap</DrawerNavLink>
                            </nav>
                            <div className="flex w-full flex-col">
                                {SHOW_GITHUB_LINK ? (
                                    <Button
                                        asChild
                                        className="rounded-full border-[0.5px] hover:brightness-99"
                                        variant="secondary"
                                    >
                                        <a
                                            className="flex items-center gap-2 px-5 py-5 font-medium"
                                            href="https://github.com/wizenheimer/subsignal"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <LogIn className="h-4 w-4" />
                                            GitHub
                                        </a>
                                    </Button>
                                ) : mounted && !isPending && user ? (
                                    <DrawerNavLink
                                        href={`${baseUrl}/dashboard`}
                                        icon={<User className="h-4 w-4" />}
                                        isButton
                                    >
                                        Dashboard
                                    </DrawerNavLink>
                                ) : (
                                    <DrawerNavLink
                                        href={`${baseUrl}/signup`}
                                        icon={<LogIn className="h-4 w-4" />}
                                        isButton
                                    >
                                        Get Started
                                    </DrawerNavLink>
                                )}
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </nav>
    );
}
