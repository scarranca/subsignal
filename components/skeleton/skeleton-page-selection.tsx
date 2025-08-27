import React from 'react';
import { Plus, X } from 'lucide-react';

const SkeletonPulse = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export default function PageSelectionStepSkeleton() {
    return (
        <div className="w-full max-w-sm mx-auto px-4">
            {/* Header Section */}
            <div className="mb-6 text-center">
                <SkeletonPulse className="h-8 w-64 mx-auto mb-2" />
                <SkeletonPulse className="h-5 w-48 mx-auto mb-6" />
            </div>

            {/* Form Section */}
            <div className="space-y-3">
                {/* URL Input Fields */}
                {[1, 2, 3].map((index) => (
                    <div key={index}>
                        <div className="flex gap-2">
                            <SkeletonPulse className="flex-1 h-10 rounded-lg" />
                            {index > 1 && (
                                <div className="h-10 w-10 flex-shrink-0 border border-gray-200 rounded-md flex items-center justify-center">
                                    <X className="w-4 h-4 text-gray-300" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add More Button */}
            <div className="mt-4">
                <div className="w-full h-10 border border-gray-200 rounded-md flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2 text-gray-300" />
                    <SkeletonPulse className="h-4 w-16" />
                </div>
            </div>

            {/* Continue Button */}
            <div className="mt-6">
                <SkeletonPulse className="w-full h-10 rounded-lg" />
            </div>
        </div>
    );
}
