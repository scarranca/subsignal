'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { apiClient } from '@/client/api';

const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

interface PagePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: {
        id: string;
        title?: string;
        url: string;
        companyName: string;
        createdAt?: Date | string;
        type?: 'page' | 'briefing';
    } | null;
}

export function PagePreviewDialog({ open, onOpenChange, content }: PagePreviewDialogProps) {
    const [expandedSnapshots, setExpandedSnapshots] = useState<Set<number>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleSnapshotExpanded = (snapshotId: number) => {
        setExpandedSnapshots((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(snapshotId)) {
                newSet.delete(snapshotId);
            } else {
                newSet.add(snapshotId);
            }
            return newSet;
        });
    };

    const toggleCategoryExpanded = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };
    // Fetch snapshots for the page when dialog opens and content is available
    const {
        data: snapshotsResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['snapshots', content?.id],
        queryFn: async () => {
            if (!content?.id) return null;
            const result = await apiClient.listSnapshotsForPage(
                content.id,
                {
                    page: 1,
                    pageSize: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                },
                'url',
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to load snapshots');
            }

            return result.data;
        },
        enabled: open && !!content?.id && content.type === 'page',
        staleTime: 30 * 1000,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="mb-1">Snapshots</DialogTitle>
                    {content && (
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-gray-600 flex-1">View Page Snapshots</p>
                            <a
                                href={content.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 flex-shrink-0"
                            >
                                View Live
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </DialogHeader>
                <div className="p-6 pt-4 max-h-[75vh] overflow-y-auto">
                    {content && content.type === 'page' && (
                        <div>
                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    <span className="ml-2 text-gray-500">Loading snapshots...</span>
                                </div>
                            )}

                            {isError && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Failed to load snapshots</p>
                                </div>
                            )}

                            {snapshotsResponse && snapshotsResponse.data.length > 0 && (
                                <div className="space-y-3">
                                    {snapshotsResponse.data.map((snapshot) => {
                                        const isExpanded = expandedSnapshots.has(snapshot.id);
                                        const hasChanges = snapshot.diff && snapshot.diff.trim();

                                        return (
                                            <div
                                                key={snapshot.id}
                                                className="border rounded-lg p-4 hover:bg-gray-50"
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {formatDate(snapshot.createdAt)}
                                                            </span>
                                                            {snapshot.url && (
                                                                <a
                                                                    href={snapshot.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                                                >
                                                                    Screenshot
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                toggleSnapshotExpanded(snapshot.id)
                                                            }
                                                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 flex-shrink-0"
                                                        >
                                                            {hasChanges ? 'Changes' : 'No Changes'}
                                                            {hasChanges &&
                                                                (isExpanded ? (
                                                                    <ChevronDown className="w-3 h-3" />
                                                                ) : (
                                                                    <ChevronRight className="w-3 h-3" />
                                                                ))}
                                                        </button>
                                                    </div>

                                                    {isExpanded && hasChanges && (
                                                        <div className="bg-gray-50 p-3 rounded-md border">
                                                            {(() => {
                                                                try {
                                                                    const parsedDiff = JSON.parse(
                                                                        snapshot.diff,
                                                                    );
                                                                    if (
                                                                        parsedDiff &&
                                                                        typeof parsedDiff ===
                                                                            'object'
                                                                    ) {
                                                                        return (
                                                                            <div className="space-y-2">
                                                                                {Object.entries(
                                                                                    parsedDiff,
                                                                                ).map(
                                                                                    ([
                                                                                        key,
                                                                                        changes,
                                                                                    ]) => {
                                                                                        const categoryId = `${snapshot.id}-${key}`;
                                                                                        const isCategoryExpanded =
                                                                                            expandedCategories.has(
                                                                                                categoryId,
                                                                                            );
                                                                                        const changeCount =
                                                                                            Array.isArray(
                                                                                                changes,
                                                                                            )
                                                                                                ? changes.length
                                                                                                : 1;

                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    key
                                                                                                }
                                                                                            >
                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        toggleCategoryExpanded(
                                                                                                            categoryId,
                                                                                                        )
                                                                                                    }
                                                                                                    className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-gray-900 w-full text-left"
                                                                                                >
                                                                                                    {isCategoryExpanded ? (
                                                                                                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                                                                                    ) : (
                                                                                                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                                                                                    )}
                                                                                                    <span className="capitalize">
                                                                                                        {key
                                                                                                            .replace(
                                                                                                                /([A-Z])/g,
                                                                                                                ' $1',
                                                                                                            )
                                                                                                            .replace(
                                                                                                                /^./,
                                                                                                                (
                                                                                                                    str,
                                                                                                                ) =>
                                                                                                                    str.toUpperCase(),
                                                                                                            )}
                                                                                                    </span>
                                                                                                    <span className="text-xs text-gray-500 font-normal">
                                                                                                        (
                                                                                                        {
                                                                                                            changeCount
                                                                                                        }{' '}
                                                                                                        change
                                                                                                        {changeCount !==
                                                                                                        1
                                                                                                            ? 's'
                                                                                                            : ''}

                                                                                                        )
                                                                                                    </span>
                                                                                                </button>

                                                                                                {isCategoryExpanded && (
                                                                                                    <ul className="space-y-1 ml-5 mt-2">
                                                                                                        {Array.isArray(
                                                                                                            changes,
                                                                                                        ) ? (
                                                                                                            changes.map(
                                                                                                                (
                                                                                                                    change,
                                                                                                                    index,
                                                                                                                ) => (
                                                                                                                    <li
                                                                                                                        key={
                                                                                                                            index
                                                                                                                        }
                                                                                                                        className="text-xs text-gray-600 flex items-start"
                                                                                                                    >
                                                                                                                        <span className="text-gray-400 mr-2 flex-shrink-0">
                                                                                                                            •
                                                                                                                        </span>
                                                                                                                        <span>
                                                                                                                            {String(
                                                                                                                                change,
                                                                                                                            ).replace(
                                                                                                                                /^"|"$/g,
                                                                                                                                '',
                                                                                                                            )}
                                                                                                                        </span>
                                                                                                                    </li>
                                                                                                                ),
                                                                                                            )
                                                                                                        ) : (
                                                                                                            <li className="text-xs text-gray-600 flex items-start">
                                                                                                                <span className="text-gray-400 mr-2 flex-shrink-0">
                                                                                                                    •
                                                                                                                </span>
                                                                                                                <span>
                                                                                                                    {String(
                                                                                                                        changes,
                                                                                                                    ).replace(
                                                                                                                        /^"|"$/g,
                                                                                                                        '',
                                                                                                                    )}
                                                                                                                </span>
                                                                                                            </li>
                                                                                                        )}
                                                                                                    </ul>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                } catch {
                                                                    // Fallback to raw display if JSON parsing fails
                                                                }
                                                                return (
                                                                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-x-auto">
                                                                        {snapshot.diff}
                                                                    </pre>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {snapshotsResponse && snapshotsResponse.data.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No snapshots available yet</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Snapshots will appear here once they&apos;re available
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {content && content.type === 'briefing' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Company
                                </label>
                                <div className="text-gray-900 bg-gray-50 p-3 rounded-md border">
                                    {content.companyName}
                                </div>
                            </div>

                            {content.createdAt && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Created
                                    </label>
                                    <div className="text-gray-900 bg-gray-50 p-3 rounded-md border">
                                        {formatDate(content.createdAt)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
