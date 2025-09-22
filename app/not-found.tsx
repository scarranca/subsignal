import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Footer from '@/components/home/footer';

export default function NotFound() {
    return (
        <>
            <div className="mx-auto mt-2 flex w-full max-w-7xl flex-col gap-12 p-4 min-h-[80vh] items-center justify-center">
                <div className="z-20 flex h-full grow flex-col items-center gap-12 text-center">
                    <Badge className="rounded-full" variant={'secondary'}>
                        404 Error
                    </Badge>

                    <h1 className="text-center font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:max-w-4xl md:text-6xl">
                        <span className="relative">
                            <span className="relative z-10 text-black">Page</span>
                            <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-red-200 py-6 md:py-8" />
                        </span>{' '}
                        not found
                    </h1>

                    <p className="md:text-lg max-w-2xl text-muted-foreground">
                        Sorry, we couldn&apos;t find the page you&apos;re looking for. The page may
                        have been moved, deleted, or doesn&apos;t exist.
                    </p>

                    <div className="flex w-fit flex-wrap items-center justify-center gap-3">
                        <Button
                            asChild
                            className="w-full rounded-full px-7 py-6 md:w-fit"
                            size="lg"
                        >
                            <Link className="flex items-center gap-2 font-medium" href="/">
                                Go Home <ChevronRight />
                            </Link>
                        </Button>

                        <Button
                            className="w-full rounded-full px-7 py-6 md:w-fit"
                            variant="secondary"
                            size="lg"
                        >
                            <Link className="flex items-center gap-2 font-medium" href="/roadmap">
                                View Roadmap
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
