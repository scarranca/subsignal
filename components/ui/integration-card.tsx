import { Button } from '@/components/ui/button';

interface IntegrationCardProps {
    title: string;
    description: string;
    buttonText?: string;
    onButtonClick: () => void;
    className?: string;
}

export function IntegrationCard({
    title,
    description,
    buttonText = 'Connect',
    onButtonClick,
    className = '',
}: IntegrationCardProps) {
    return (
        <div className={`bg-gray-50 rounded-lg p-4 max-w-md ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
                <Button
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={onButtonClick}
                >
                    {buttonText}
                </Button>
            </div>
        </div>
    );
}
