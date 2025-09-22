'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import BoringAvatar from 'boring-avatars';

import { cn } from '@/lib/utils';

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
            {...props}
        />
    );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn('aspect-square size-full', className)}
            {...props}
        />
    );
}

function AvatarFallback({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                'bg-muted flex size-full items-center justify-center rounded-full',
                className,
            )}
            {...props}
        />
    );
}

interface BoringAvatarImageProps {
    name: string;
    size?: number;
    variant?: 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';
    colors?: string[];
    className?: string;
}

function BoringAvatarImage({
    name,
    size = 40,
    variant = 'beam',
    colors = ['#fcfef5', '#e9ffe1', '#cdcfb7', '#d6e6c3', '#fafbe3'],
    className,
}: BoringAvatarImageProps) {
    return (
        <div className={cn('flex items-center justify-center', className)}>
            <BoringAvatar size={size} name={name} variant={variant} colors={colors} />
        </div>
    );
}

export { Avatar, AvatarImage, AvatarFallback, BoringAvatarImage };
