'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface URLInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: boolean;
    id?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const URLInput = React.forwardRef<HTMLInputElement, URLInputProps>(
    (
        { value, onChange, placeholder = 'example.com', className, error, id, onKeyDown, ...props },
        ref,
    ) => {
        const [protocol, setProtocol] = React.useState<'http' | 'https'>('https');

        // Detect protocol and strip it from display value
        const processUrl = (url: string): { protocol: 'http' | 'https'; cleanUrl: string } => {
            const httpMatch = url.match(/^http:\/\//i);
            const httpsMatch = url.match(/^https:\/\//i);

            if (httpMatch) {
                return { protocol: 'http', cleanUrl: url.replace(/^http:\/\//i, '') };
            } else if (httpsMatch) {
                return { protocol: 'https', cleanUrl: url.replace(/^https:\/\//i, '') };
            } else {
                return { protocol: 'https', cleanUrl: url };
            }
        };

        // Handle input changes and detect protocol
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            const { protocol: detectedProtocol, cleanUrl } = processUrl(inputValue);

            // Update protocol state if user typed a protocol
            if (inputValue.match(/^https?:\/\//i)) {
                setProtocol(detectedProtocol);
            }

            onChange(cleanUrl);
        };

        const displayValue = processUrl(value).cleanUrl;

        return (
            <div
                className={cn(
                    'flex items-center w-full rounded-md border border-input bg-background text-sm ring-offset-background',
                    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    error && 'border-destructive',
                    className,
                )}
            >
                <div className="flex items-center px-3 py-2 text-muted-foreground border-r border-border">
                    <span className="text-sm font-medium whitespace-nowrap">{protocol}://</span>
                </div>
                <input
                    ref={ref}
                    id={id}
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    onKeyDown={onKeyDown}
                    className="flex-1 px-3 py-2 bg-transparent border-0 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    {...props}
                />
            </div>
        );
    },
);

URLInput.displayName = 'URLInput';
