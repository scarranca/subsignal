'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { ChevronDown, ChevronRight, ChevronLeft, Archive, ArrowUpRight } from 'lucide-react';
import { apiClient } from '@/client/api';
import type { CompanyBriefing } from '@/types/api';
import { queryKeys } from '@/lib/query-keys';
import PagesViewSkeleton from './skeleton/skeleton-pages-view';
import { BriefingContentDialog } from './BriefingContentDialog';
import { showToast } from '@/lib/toast';

interface CompanyWithBriefings extends CompanyBriefing {
    domain: string;
    expanded: boolean;
}

// Helper function - moved to top for hoisting
const extractDomain = (url: string) => {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export function BriefingView() {
    const [currentPage, setCurrentPage] = useState(1);
    const companiesPerPage = 10;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBriefing, setSelectedBriefing] = useState<{
        id: string;
        companyName: string;
        contentUrl: string;
        createdAt: Date | string;
    } | null>(null);

    // TanStack Query for briefings data
    const {
        data: briefingsResponse,
        isLoading: loading,
        isError,
    } = useQuery({
        queryKey: queryKeys.briefings({
            page: currentPage,
            pageSize: companiesPerPage,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        }),
        queryFn: async () => {
            const result = await apiClient.getBriefings({
                page: currentPage,
                pageSize: companiesPerPage,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to load briefings');
            }

            return result.data;
        },
        staleTime: 30 * 1000, // 30 seconds
        retry: (failureCount, error) => {
            // Don't retry on 4xx errors
            if (error?.message?.includes('4')) return false;
            return failureCount < 2;
        },
    });

    // Local state for expanded companies
    const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

    // Transform briefings data
    const companiesWithBriefings: CompanyWithBriefings[] = briefingsResponse
        ? briefingsResponse.data.map((companyBriefing) => ({
              ...companyBriefing,
              domain: extractDomain(companyBriefing.company.url),
              expanded: expandedCompanies.has(companyBriefing.company.id),
          }))
        : [];

    const toggleExpanded = (id: string) => {
        setExpandedCompanies((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getFaviconUrl = (domain: string) => {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        // Reset expanded companies when changing pages
        setExpandedCompanies(new Set());
    };

    const openBriefingContent = (
        briefingId: number | string,
        companyName: string,
        contentUrl: string,
        createdAt: Date | string,
    ) => {
        setSelectedBriefing({ id: String(briefingId), companyName, contentUrl, createdAt });
        setDialogOpen(true);
    };

    if (loading) {
        return <PagesViewSkeleton />;
    }

    if (isError) {
        return (
            <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">Failed to load briefings</div>
                    <button
                        onClick={() => {
                            setCurrentPage(1);
                        }}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen">
            <div className="max-w-4xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Briefings</h1>
                        <p className="text-sm text-gray-600 mt-1">View your briefing archive</p>
                    </div>
                </div>

                {companiesWithBriefings.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">No briefings available yet</div>
                        <p className="text-sm text-gray-400">
                            Briefings will appear here once they&apos;re generated for your
                            companies
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Companies with Briefings List */}
                        <div className="space-y-4">
                            {companiesWithBriefings.map((companyWithBriefings) => (
                                <div key={companyWithBriefings.company.id}>
                                    {/* Company Header */}
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                            <ImageWithFallback
                                                src={getFaviconUrl(companyWithBriefings.domain)}
                                                alt={`${companyWithBriefings.company.name} favicon`}
                                                width={24}
                                                height={24}
                                                className="w-6 h-6"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {companyWithBriefings.company.name}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {companyWithBriefings.company.url}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            {companyWithBriefings.briefings.length > 0 ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() =>
                                                        toggleExpanded(
                                                            companyWithBriefings.company.id,
                                                        )
                                                    }
                                                >
                                                    {companyWithBriefings.expanded ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            ) : (
                                                <div
                                                    className="h-8 w-8 p-0 flex items-center justify-center cursor-pointer opacity-50 hover:opacity-70 transition-opacity"
                                                    onClick={() =>
                                                        showToast.info(
                                                            'No briefings yet, stay tuned',
                                                        )
                                                    }
                                                    title="Nothing yet"
                                                >
                                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Briefings */}
                                    {companyWithBriefings.expanded &&
                                        companyWithBriefings.briefings.length > 0 && (
                                            <div className="ml-6 md:ml-9 space-y-3 mb-4">
                                                {companyWithBriefings.briefings.map((briefing) => (
                                                    <div
                                                        key={briefing.id}
                                                        className="group flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2 cursor-pointer"
                                                        onClick={() =>
                                                            openBriefingContent(
                                                                briefing.id,
                                                                companyWithBriefings.company.name,
                                                                briefing.content,
                                                                briefing.createdAt,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                            <Archive className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                    {formatDate(briefing.createdAt)}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                                    <span>View</span>
                                                                    <ArrowUpRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination - Note: This is simplified since the API doesn't return pagination info yet */}
                        {companiesWithBriefings.length === companiesPerPage && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 pt-6 space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-600 text-center sm:text-left">
                                    Showing page {currentPage}
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="flex items-center space-x-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline">Previous</span>
                                    </Button>

                                    <div className="flex items-center space-x-1">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-8 h-8 p-0 bg-gray-900 hover:bg-gray-800 text-white"
                                        >
                                            {currentPage}
                                        </Button>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={companiesWithBriefings.length < companiesPerPage}
                                        className="flex items-center space-x-1"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <BriefingContentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                briefing={selectedBriefing}
            />
        </div>
    );
}
