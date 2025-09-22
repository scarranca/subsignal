'use client';

import Link from 'next/link';
import React from 'react';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { Separator } from '@/components/ui/separator';
import Logo from '@/components/ui/logo';

export default function Footer() {
    return (
        <footer className="mx-auto my-12 w-full max-w-7xl bg-background">
            <div className="mx-auto flex w-full flex-col px-4 md:px-8">
                {/* Rounded container matching ikiform */}
                <div className="rounded-4xl bg-card p-8 md:p-12">
                    <div className="flex flex-col gap-8">
                        {/* Top section with logo and navigation */}
                        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
                            {/* Header section with logo */}
                            <div className="flex flex-shrink-0 flex-col gap-8">
                                <div className="flex flex-shrink-0 flex-col gap-4">
                                    <Logo size="lg" />
                                    <p className="max-w-sm text-muted-foreground text-sm">
                                        © {new Date().getFullYear()} Subsignal. All rights
                                        reserved.
                                    </p>
                                </div>
                            </div>

                            <Separator className="flex lg:hidden" />

                            {/* Navigation sections */}
                            <div className="flex flex-wrap gap-8 md:grid md:grid-cols-3 md:gap-10">
                                <div className="flex flex-col gap-4">
                                    <h3 className="font-semibold text-foreground">Product</h3>
                                    <ul className="flex flex-col gap-2">
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/#features"
                                            >
                                                Features
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/#pricing"
                                            >
                                                Pricing
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="font-semibold text-foreground">Company</h3>
                                    <ul className="flex flex-col gap-2">
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/blog"
                                            >
                                                Blog
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/roadmap"
                                            >
                                                Roadmap
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/"
                                            >
                                                Contact
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="font-semibold text-foreground">Legal</h3>
                                    <ul className="flex flex-col gap-2">
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/privacy"
                                            >
                                                Privacy Policy
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/terms"
                                            >
                                                Terms of Service
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/gdpr"
                                            >
                                                GDPR
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                                href="/dpa"
                                            >
                                                DPA
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Bottom section with social links */}
                        <div className="flex w-full flex-col items-end justify-center gap-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                                    <Link
                                        className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        href="https://github.com/wizenheimer"
                                        target="_blank"
                                    >
                                        <FaGithub className="h-4 w-4" />
                                    </Link>
                                    <span>/</span>
                                    <Link
                                        className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        href="https://www.linkedin.com/in/0xnayan/"
                                        target="_blank"
                                    >
                                        <FaLinkedin className="h-4 w-4" />
                                    </Link>
                                    <span>/</span>
                                    <Link
                                        className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        href="#"
                                        target="_blank"
                                    >
                                        <FaXTwitter className="h-4 w-4" />
                                    </Link>
                                    <span>/</span>
                                    <Link
                                        className="flex items-center gap-2 transition-colors hover:text-foreground"
                                        href="#"
                                        target="_blank"
                                    >
                                        nick@subsignal.vc
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
