// Generic skeleton component for onboarding steps
export default function OnboardingSkeleton() {
    return (
        <div className="w-full max-w-sm mx-auto px-4">
            {/* Header skeleton */}
            <div className="text-center mb-8">
                <div className="h-7 bg-gray-200 rounded mx-auto mb-2 w-48 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded mx-auto w-64 animate-pulse" />
            </div>

            {/* Content area skeleton */}
            <div className="space-y-4 mb-8">
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Button skeleton */}
            <div className="mt-6">
                <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse" />
            </div>
        </div>
    );
}
