'use client';

import { ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Avatar, BoringAvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AiFillExperiment } from 'react-icons/ai';
import { CAL_URL } from '@/constants/contact';

export default function Hero() {
    return (
        <section className="mx-auto mt-2 flex w-full max-w-7xl flex-col gap-12 p-4">
            <div className="z-20 flex h-full grow flex-col items-center gap-12 text-center">
                <Badge className="rounded-full" variant={'secondary'}>
                    <Link
                        className="flex items-center justify-center gap-2"
                        href={CAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <AiFillExperiment className="h-4 w-4" />
                        Public Beta
                    </Link>
                </Badge>

                <h1 className="text-center font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:max-w-4xl md:text-6xl">
                    We{' '}
                    <span className="relative">
                        <span className="relative z-10 text-black">monitor</span>
                        <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-blue-200 py-6 md:py-8" />
                    </span>{' '}
                    your{' '}
                    <span className="relative">
                        <span className="relative z-10 text-black">companies</span>
                        <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-yellow-200 py-6 md:py-8" />
                    </span>{' '}
                    so you don&apos;t have to
                </h1>

                <p className="md:text-lg max-w-2xl">
                    Keep tabs on companies and competitors that matter to you. Stay connected
                    through pivots and false starts. Time your bets better.
                </p>

                <div className="flex w-fit flex-wrap items-center justify-center gap-3">
                    <Button asChild className="w-full rounded-full px-7 py-6 md:w-fit" size="lg">
                        <Link className="flex items-center gap-2 font-medium" href="/signup">
                            Get Started <ChevronRight />
                        </Link>
                    </Button>

                    <Button
                        className="w-full rounded-full px-7 py-6 md:w-fit"
                        variant="secondary"
                        size="lg"
                    >
                        <Link
                            className="flex items-center gap-2 font-medium"
                            href={CAL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Contact Sales
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 bg-transparent px-0 py-2 md:px-2">
                    <div className="flex -space-x-2">
                        {['Alice Childress', 'Bob', 'Charlie', 'Diana', 'Maggie L'].map(
                            (name, i) => (
                                <Avatar key={i} className="border-2 border-background">
                                    <BoringAvatarImage name={name} size={40} variant="beam" />
                                </Avatar>
                            ),
                        )}
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-full px-5 py-2">
                        <span className="flex items-center justify-center gap-1 text-center">
                            <span className="text-sm opacity-80">Monitoring over</span>
                            <span className="text-sm">87+</span>
                            <span className="text-sm opacity-80">companies</span>
                        </span>
                        <div className="mt-2 flex items-center justify-start gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="fill-yellow-400 text-yellow-400"
                                    size={18}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
