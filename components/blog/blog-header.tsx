interface BlogHeaderProps {
    title?: string;
    description?: string;
}

export default function BlogHeader({
    title = 'Blog',
    description = 'Your frontrow seat to everything Subsignal',
}: BlogHeaderProps) {
    return (
        <div className="mb-8 flex flex-col items-center justify-center gap-6 text-center">
            <h1 className="font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:text-6xl">
                <span className="relative">
                    <span className="relative z-10 text-black">{title}</span>
                    <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-pink-200 py-6 md:py-8" />
                </span>
            </h1>
            <p className="md:text-lg max-w-2xl text-muted-foreground">{description}</p>
        </div>
    );
}
