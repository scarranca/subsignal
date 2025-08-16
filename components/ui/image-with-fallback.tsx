'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    fallbackIcon?: React.ComponentType<{ className?: string }>;
    fallbackClassName?: string;
}

export function ImageWithFallback({
    src,
    alt,
    width,
    height,
    className,
    fallbackIcon: FallbackIcon = FileText,
    fallbackClassName = 'bg-gray-100 text-gray-600',
}: ImageWithFallbackProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center rounded flex-shrink-0',
                    fallbackClassName,
                    className,
                )}
                style={{ width, height }}
            >
                <FallbackIcon className={cn('w-4 h-4')} />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            unoptimized
            className={cn('rounded flex-shrink-0', className)}
            onError={() => setHasError(true)}
        />
    );
}
