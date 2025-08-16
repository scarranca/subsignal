'use client';

import { useState } from 'react';
import Image from 'next/image';
import BoringAvatar from 'boring-avatars';
import { AVATAR_COLORS } from '@/constants/palette';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
}

export function ImageWithFallback({ src, alt, width, height, className }: ImageWithFallbackProps) {
    const [imageState, setImageState] = useState<'loading' | 'exists' | 'generic' | 'error'>(
        'loading',
    );

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement;

        // Check if the image is the generic globe (always 16x16 when sz=64 is used)
        if (img.naturalHeight === 16 || img.naturalWidth === 16) {
            setImageState('generic');
        } else {
            setImageState('exists');
        }
    };

    const handleImageError = () => {
        setImageState('error');
    };

    // Show boring avatar if image is generic or doesn't exist
    if (imageState === 'generic' || imageState === 'error') {
        return (
            <div className={cn('flex-shrink-0', className)}>
                <BoringAvatar
                    size={Math.max(width, height)}
                    name={alt}
                    variant="marble"
                    // square
                    colors={AVATAR_COLORS}
                />
            </div>
        );
    }

    // Show image if it exists and is not generic
    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            unoptimized
            className={cn('rounded flex-shrink-0', className)}
            onLoad={handleImageLoad}
            onError={handleImageError}
        />
    );
}
