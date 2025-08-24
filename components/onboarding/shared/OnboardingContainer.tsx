interface OnboardingContainerProps {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const OnboardingContainer = ({ children, maxWidth = 'sm' }: OnboardingContainerProps) => {
    const widthClass =
        maxWidth === 'sm'
            ? 'max-w-sm'
            : maxWidth === 'lg'
              ? 'max-w-2xl'
              : maxWidth === 'xl'
                ? 'max-w-4xl'
                : maxWidth === '2xl'
                  ? 'max-w-6xl'
                  : maxWidth === '4xl'
                    ? 'max-w-7xl'
                    : 'max-w-sm';

    return <div className={`w-full ${widthClass} mx-auto px-4 sm:px-6 lg:px-8`}>{children}</div>;
};
