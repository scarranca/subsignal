'use client';

import Link from 'next/link';

interface TermsCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    mode?: 'signup' | 'login';
    className?: string;
}

export const TermsCheckbox = ({
    checked,
    onChange,
    mode = 'signup',
    className = '',
}: TermsCheckboxProps) => {
    const actionText = mode === 'login' ? 'logging in' : 'signing up';

    return (
        <div className={`mt-4 w-full ${className}`}>
            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <span className="text-xs text-black leading-relaxed">
                    By {actionText}, you agree to our{' '}
                    <Link
                        href="/terms"
                        className="text-black hover:text-gray-700 underline"
                        target="_blank"
                    >
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                        href="/privacy"
                        className="text-black hover:text-gray-700 underline"
                        target="_blank"
                    >
                        Privacy Policy
                    </Link>
                </span>
            </label>
        </div>
    );
};
