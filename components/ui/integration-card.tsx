import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface IntegrationCardProps {
    title: string;
    description: string;
    icon?: string;
    buttonText?: string;
    onButtonClick: () => void;
    className?: string;
}

export function IntegrationCard({
    title,
    description,
    icon,
    buttonText = 'Integrate',
    onButtonClick,
    className = '',
}: IntegrationCardProps) {
    return (
        <div
            className={`border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow ${className}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {icon && (
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Image
                                src={icon}
                                alt={`${title} logo`}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain"
                            />
                        </div>
                    )}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">{description}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm w-24"
                    onClick={onButtonClick}
                >
                    {buttonText}
                </Button>
            </div>
        </div>
    );
}
