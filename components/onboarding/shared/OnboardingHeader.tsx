interface OnboardingHeaderProps {
    title: string;
    subtitle: string;
}

export const OnboardingHeader = ({ title, subtitle }: OnboardingHeaderProps) => {
    return (
        <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold mb-2 text-center font-lora">{title}</h1>
            <p className="text-base text-muted-foreground mb-6 text-center font-lora">{subtitle}</p>
        </div>
    );
};
