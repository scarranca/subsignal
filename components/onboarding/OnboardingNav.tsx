import Link from 'next/link';

export const OnboardingNav = () => {
    return (
        <nav className="absolute top-0 left-0 w-full flex items-center justify-between h-20 px-8">
            <Link href="/" className="text-xl font-semibold font-lora">
                Subsignal
            </Link>
        </nav>
    );
};
