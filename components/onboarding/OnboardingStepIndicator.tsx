interface OnboardingStepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    onStepClick: (step: number) => void;
    className?: string;
}

export const OnboardingStepIndicator = ({
    currentStep,
    totalSteps,
    onStepClick,
    className = '',
}: OnboardingStepIndicatorProps) => {
    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            {Array.from({ length: totalSteps }, (_, index) => {
                const step = index + 1;
                const isActive = currentStep === step;

                return (
                    <button
                        key={step}
                        className={`w-2 h-2 rounded-full transition-all duration-200 hover:bg-gray-500 ${
                            isActive ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                        onClick={() => onStepClick(step)}
                        aria-label={`Go to step ${step}`}
                    />
                );
            })}
        </div>
    );
};
