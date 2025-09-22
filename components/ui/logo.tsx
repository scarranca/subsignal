import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    href?: string;
}

const sizeVariants = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
};

export default function Logo({ className, size = 'md', href = '/' }: LogoProps) {
    const logoText = (
        <span
            className={cn(
                'font-dm-sans font-semibold tracking-tight',
                sizeVariants[size],
                className,
            )}
        >
            Subsignal
        </span>
    );

    if (href) {
        return <Link href={href}>{logoText}</Link>;
    }

    return logoText;
}
