import React from 'react';

const SkeletonPulse = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export default function SettingsViewSkeleton() {
    return (
        <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen">
            <div className="max-w-4xl space-y-12">
                {/* Properties Section */}
                <div>
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <SkeletonPulse className="h-7 w-24 mb-2" />
                            <SkeletonPulse className="h-4 w-44" />
                        </div>
                        {/* Save button placeholder */}
                        <SkeletonPulse className="h-8 w-28" />
                    </div>

                    {/* Properties Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <SkeletonPulse className="w-4 h-4 mt-0.5 rounded-sm" />
                                <div className="text-sm min-w-0 flex-1">
                                    <SkeletonPulse className="h-4 w-16 mb-2" />
                                    <SkeletonPulse className="h-3 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Frequency Section */}
                <div>
                    <div className="mb-8">
                        <SkeletonPulse className="h-7 w-20 mb-2" />
                        <SkeletonPulse className="h-4 w-40" />
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <SkeletonPulse className="h-10 w-full sm:max-w-xs" />
                        </div>
                    </div>
                </div>

                {/* Integrations Section */}
                <div>
                    <div className="mb-8">
                        <SkeletonPulse className="h-7 w-24" />
                    </div>

                    <div className="space-y-6">
                        {/* Integration Card 1 */}
                        <div className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <SkeletonPulse className="h-5 w-16 mb-2" />
                                    <SkeletonPulse className="h-4 w-48" />
                                </div>
                                <SkeletonPulse className="h-9 w-20 ml-4" />
                            </div>
                        </div>

                        {/* Integration Card 2 */}
                        <div className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <SkeletonPulse className="h-5 w-12 mb-2" />
                                    <SkeletonPulse className="h-4 w-44" />
                                </div>
                                <SkeletonPulse className="h-9 w-20 ml-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Alternative Loading State Skeleton (for when preferences are loading)
export function LoadingStateSkeleton() {
    return (
        <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen flex items-center justify-center">
            <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-300 rounded-full animate-spin border-2 border-gray-200 border-t-gray-600" />
                <SkeletonPulse className="h-4 w-36" />
            </div>
        </div>
    );
}
