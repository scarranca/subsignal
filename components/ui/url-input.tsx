import React from 'react';
import { Input } from '@/components/ui/input';
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
            <div className={cn('relative', className)}>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center pointer-events-none">
                    <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md">
                        {protocol}://
                    </span>
                    <div className="w-px h-6 bg-gray-300 ml-1"></div>
                </div>
                <Input
                    ref={ref}
                    id={id}
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    onKeyDown={onKeyDown}
                    className={cn('pl-[74px] pr-3', error && 'border-red-500')}
                    {...props}
                />
            </div>
        );
    },
);

URLInput.displayName = 'URLInput';
