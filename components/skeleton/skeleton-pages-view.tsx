import { ChevronRight, FileText } from 'lucide-react';

const SkeletonPulse = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export default function PagesViewSkeleton() {
    return (
        <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen">
            <div className="max-w-4xl">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
                    <div>
                        <SkeletonPulse className="h-7 w-32 mb-2" />
                        <SkeletonPulse className="h-4 w-48" />
                    </div>
                    <div className="w-full sm:w-auto">
                        <SkeletonPulse className="h-10 w-full sm:w-28" />
                    </div>
                </div>

                {/* Companies List Skeleton */}
                <div className="space-y-4">
                    {/* Company 1 - Expanded */}
                    <div>
                        {/* Company Header */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <SkeletonPulse className="w-6 h-6 rounded" />
                                <div className="min-w-0 flex-1">
                                    <SkeletonPulse className="h-5 w-40 mb-1" />
                                    <SkeletonPulse className="h-4 w-56" />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <div className="h-8 w-8 flex items-center justify-center">
                                    <ChevronRight className="h-4 w-4 text-gray-300 rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Expanded Pages */}
                        <div className="ml-6 md:ml-9 space-y-3 mb-4">
                            {[1, 2, 3].map((index) => (
                                <div
                                    key={index}
                                    className="group flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2"
                                >
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                        <SkeletonPulse className="w-4 h-4 rounded" />
                                        <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <SkeletonPulse className="h-4 w-48 mb-1" />
                                            <SkeletonPulse className="h-3 w-64" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Company 2 - Collapsed */}
                    <div>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <SkeletonPulse className="w-6 h-6 rounded" />
                                <div className="min-w-0 flex-1">
                                    <SkeletonPulse className="h-5 w-36 mb-1" />
                                    <SkeletonPulse className="h-4 w-52" />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <div className="h-8 w-8 flex items-center justify-center">
                                    <ChevronRight className="h-4 w-4 text-gray-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pagination Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 pt-6 space-y-4 sm:space-y-0">
                    <div className="text-center sm:text-left">
                        <SkeletonPulse className="h-4 w-48" />
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <SkeletonPulse className="h-8 w-20" />
                        <div className="flex items-center space-x-1">
                            <SkeletonPulse className="w-8 h-8 rounded" />
                            <SkeletonPulse className="w-8 h-8 rounded" />
                            <SkeletonPulse className="w-8 h-8 rounded" />
                        </div>
                        <SkeletonPulse className="h-8 w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}
