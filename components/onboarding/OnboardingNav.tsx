import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface OnboardingNavProps {
    currentStep: number;
    onNext: () => void;
}

export const OnboardingNav = ({ currentStep, onNext }: OnboardingNavProps) => {
    return (
        <nav className="absolute top-0 left-0 w-full flex items-center justify-between h-20 px-8">
            <Link href="/" className="text-xl font-semibold font-lora">
                Subsignal
            </Link>
            <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200"
                onClick={onNext}
            >
                {currentStep === 4 ? (
                    <>
                        Dashboard
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                    </>
                ) : (
                    <>
                        Next
                        <span className="ml-2 text-xs text-gray-500 font-mono">⌘ + ↵</span>
                    </>
                )}
            </Button>
        </nav>
    );
};
