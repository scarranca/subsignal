import { Button } from '@/components/ui/button';

interface ContinueButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    children?: React.ReactNode;
    loadingText?: string;
}

export const ContinueButton = ({
    onClick,
    disabled = false,
    isLoading = false,
    children = 'Continue',
    loadingText = 'Saving...',
}: ContinueButtonProps) => {
    return (
        <div className="mt-6">
            <Button
                onClick={onClick}
                disabled={disabled || isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-10"
            >
                {isLoading ? loadingText : children}
            </Button>
        </div>
    );
};
