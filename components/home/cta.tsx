import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CAL_URL } from '@/constants/contact';

export default function CTA() {
    return (
        <section className="mx-auto w-full max-w-7xl bg-background">
            <div className="mx-auto flex w-full flex-col px-4 md:px-8">
                <div className="rounded-4xl bg-card p-8 py-12 md:p-12 md:py-16">
                    <div className="flex flex-col items-center gap-8 text-center">
                        {/* Main heading */}
                        <div className="flex flex-col gap-6">
                            <h2 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
                                Focus on the{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-20 text-black">big picture</span>
                                    <span className="absolute inset-0 top-1/2 -translate-y-1/2 -rotate-1 z-10 rounded-md bg-blue-200 py-6 md:py-8" />
                                </span>{' '}
                                let us handle the{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-20 text-black">details</span>
                                    <span className="absolute inset-0 top-1/2 -translate-y-1/2 -rotate-1 z-10 rounded-md bg-yellow-200 py-6 md:py-8" />
                                </span>
                            </h2>
                            <p className="text-center text-base text-muted-foreground md:text-lg">
                                Join other marquee funds using Subsignal to turn comeback stories
                                into portfolio wins
                            </p>
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            <Button
                                asChild
                                className="w-full rounded-full px-7 py-6 md:w-fit"
                                size="lg"
                            >
                                <Link
                                    className="flex items-center gap-2 font-medium"
                                    href="/get-started"
                                >
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
                    </div>
                </div>
            </div>
        </section>
    );
}
