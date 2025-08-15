interface OnboardingStepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    className?: string;
}

export const OnboardingStepIndicator = ({
    currentStep,
    totalSteps,
    className = '',
}: OnboardingStepIndicatorProps) => {
    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            {Array.from({ length: totalSteps }, (_, index) => {
                const step = index + 1;
                const isActive = currentStep === step;

                return (
                    <div
                        key={step}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            isActive ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                    />
                );
            })}
        </div>
    );
};
