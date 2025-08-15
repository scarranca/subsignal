'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

// Normalize URL by adding protocol if missing
const normalizeUrl = (url: string): string => {
    if (!url.trim()) return url;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
    }
    return trimmed;
};

// Validate URL with flexible input
const urlSchema = z.object({
    urls: z
        .array(
            z.object({
                url: z
                    .string()
                    .min(1, 'URL is required')
                    .transform(normalizeUrl)
                    .refine((url) => {
                        try {
                            new URL(url);
                            return true;
                        } catch {
                            return false;
                        }
                    }, 'Please enter a valid website (e.g., stripe.com or https://stripe.com)'),
            }),
        )
        .min(1, 'At least one URL is required')
        .max(5, 'Maximum 5 URLs allowed'),
});

type UrlFormData = z.infer<typeof urlSchema>;

interface OnboardingStepOneProps {
    onComplete: (urls: string[]) => void;
    onAdvance: (urls: string[]) => Promise<void>;
    isLoading: boolean;
    initialUrls: string[];
}

export const OnboardingStepOne = ({
    onComplete,
    onAdvance,
    isLoading,
    initialUrls,
}: OnboardingStepOneProps) => {
    const form = useForm<UrlFormData>({
        resolver: zodResolver(urlSchema),
        defaultValues: {
            urls: initialUrls.length > 0 ? initialUrls.map((url) => ({ url })) : [{ url: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'urls',
    });

    const addUrlField = () => {
        if (fields.length < 5) {
            append({ url: '' });
        } else {
            toast.error('Maximum 5 URLs allowed');
        }
    };

    const removeUrlField = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        } else {
            toast.error('At least one URL is required');
        }
    };

    // Verify that URLs are reachable
    const verifyUrls = async (urls: string[]): Promise<{ valid: string[]; invalid: string[] }> => {
        const results = await Promise.allSettled(
            urls.map(async (url) => {
                try {
                    await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: AbortSignal.timeout(5000),
                    });
                    return { url, valid: true };
                } catch {
                    return { url, valid: false };
                }
            }),
        );

        const valid: string[] = [];
        const invalid: string[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                if (result.value.valid) {
                    valid.push(urls[index]);
                } else {
                    invalid.push(urls[index]);
                }
            } else {
                invalid.push(urls[index]);
            }
        });

        return { valid, invalid };
    };

    const onSubmit = async (data: UrlFormData) => {
        const validUrls = data.urls.map((item) => item.url);
        console.log('Form - Raw form data:', data);
        console.log('Form - Extracted URLs:', validUrls);

        // Filter out empty URLs and duplicates
        const filteredUrls = [...new Set(validUrls.filter((url) => url.trim() !== ''))];
        console.log('Filtered URLs (removed empty/duplicates):', filteredUrls);

        // Show filtering feedback if URLs were removed
        const removedCount = validUrls.length - filteredUrls.length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} empty or duplicate URLs`);
        }

        // Skip API call if no valid URLs after filtering
        if (filteredUrls.length === 0) {
            toast.error('Please enter at least one valid URL');
            return;
        }

        // Show verification loading state
        toast.loading('Verifying URLs...', { id: 'url-verification' });

        try {
            // Verify URLs are reachable
            const { valid, invalid } = await verifyUrls(filteredUrls);
            console.log('Verification - Valid URLs:', valid);
            console.log('Verification - Invalid URLs:', invalid);

            if (invalid.length > 0) {
                toast.error(`Unable to reach: ${invalid.join(', ')}`, { id: 'url-verification' });
                return;
            }

            toast.success('URLs verified successfully', { id: 'url-verification' });
            console.log('Sending to parent component:', valid);
            onComplete(valid);
            await onAdvance(valid);
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Error verifying URLs. Please try again.', { id: 'url-verification' });
        }
    };

    const handleSubmit = () => {
        form.handleSubmit(onSubmit, (errors) => {
            // Show first validation error as toast
            if (errors.urls?.message) {
                toast.error(errors.urls.message);
            } else if (errors.urls?.[0]?.url?.message) {
                toast.error(errors.urls[0].url.message);
            } else {
                toast.error('Please fix the form errors and try again');
            }
        })();
    };

    const watchedUrls = form.watch('urls');
    const hasValidUrls = watchedUrls.some((item) => item.url.trim() !== '');

    return (
        <div className="w-full max-w-sm mx-auto px-4">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold mb-2 text-center font-lora">
                    Follow Breakout Companies
                </h1>
                <p className="text-base text-muted-foreground mb-6 text-center font-lora">
                    Keep your sector thesis current
                </p>
            </div>
            <Form {...form}>
                <form className="space-y-3">
                    {fields.map((field, index) => (
                        <FormField
                            key={field.id}
                            control={form.control}
                            name={`urls.${index}.url`}
                            render={({ field: formField }) => (
                                <FormItem>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input
                                                {...formField}
                                                placeholder={
                                                    index === 0
                                                        ? 'stripe.com'
                                                        : index === 1
                                                          ? 'shopify.com'
                                                          : index === 2
                                                            ? 'github.com'
                                                            : index === 3
                                                              ? 'notion.so'
                                                              : 'airbnb.com'
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleSubmit();
                                                    }
                                                }}
                                                className="h-10 text-sm bg-gray-50 border-gray-200 rounded-lg px-3 flex-1"
                                            />
                                        </FormControl>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeUrlField(index)}
                                                className="h-10 w-10 flex-shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </form>
            </Form>

            {/* Add More button */}
            {fields.length < 5 && (
                <div className="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addUrlField}
                        className="w-full h-10 text-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add More
                    </Button>
                </div>
            )}

            {/* Continue button */}
            {hasValidUrls && (
                <div className="mt-6">
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10"
                    >
                        {isLoading ? 'Setting up...' : 'Continue'}
                    </Button>
                </div>
            )}
        </div>
    );
};
