import { CheckmarkIcon } from './CheckmarkIcon';

interface PricingFeature {
    text: string;
    included?: boolean;
}

interface SelectablePricingCardProps {
    planName: string;
    price: string;
    period?: string;
    description: string;
    features: PricingFeature[];
    isSelected: boolean;
    onClick: () => void;
    isPopular?: boolean;
    isCurrent?: boolean;
}

export const SelectablePricingCard = ({
    planName,
    price,
    period,
    description,
    features,
    isSelected,
    onClick,
    isPopular = false,
    isCurrent = false,
}: SelectablePricingCardProps) => {
    return (
        <div
            className={`relative cursor-pointer transition-all ${
                isSelected
                    ? 'bg-black text-white shadow-xl border border-transparent'
                    : 'bg-white border border-zinc-200 shadow-sm hover:shadow-md'
            } rounded-xl p-3 sm:p-4 mb-4 min-h-[140px] sm:min-h-[280px] md:min-h-[320px] flex flex-col`}
            onClick={onClick}
        >
            {(isPopular || isCurrent) && (
                <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 ${
                        isCurrent ? 'bg-green-600' : 'bg-blue-600'
                    } text-white px-3 py-1 rounded-full text-sm font-medium`}
                >
                    {isCurrent ? 'Current Plan' : 'Most Popular'}
                </div>
            )}

            <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold mb-1">{planName}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold">{price}</span>
                    {period && (
                        <span
                            className={`text-sm sm:text-base ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                            {period}
                        </span>
                    )}
                </div>
                <p className={`mt-2 text-xs ${isSelected ? 'text-gray-400' : 'text-gray-600'}`}>
                    {description}
                </p>
            </div>

            {/* Features - hidden on very small screens */}
            <ul className="space-y-2 hidden sm:block sm:flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                        <CheckmarkIcon
                            className={
                                feature.included !== false
                                    ? 'w-4 h-4 text-green-500'
                                    : 'w-4 h-4 text-gray-300'
                            }
                        />
                        {feature.text}
                    </li>
                ))}
            </ul>

            {/* Selection indicator */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                            ? 'border-white bg-white'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                    {isSelected && (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-black rounded-full"></div>
                    )}
                </div>
            </div>
        </div>
    );
};
