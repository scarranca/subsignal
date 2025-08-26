'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
    ChevronLeft,
    Loader2,
    FileText,
    ArrowUpRight,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { URLInput } from '@/components/ui/url-input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { apiClient, type Company as ApiCompany, type Page as ApiPage } from '@/client/api';
import { normalizeUrl, isValidUrl } from '@/lib/url';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';

interface Company extends Omit<ApiCompany, 'pages'> {
    domain: string;
    pages: ApiPage[];
    expanded: boolean;
}

// Validate URL with flexible input (using centralized utility)
const validateUrl = (url: string): boolean => {
    return isValidUrl(url);
};

// Helper function - moved to top for hoisting
const extractDomain = (url: string) => {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

export function PagesView() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const companiesPerPage = 4;

    // TanStack Query for companies data
    const {
        data: companiesResponse,
        isLoading: loading,
        isError,
    } = useQuery({
        queryKey: queryKeys.companies({
            page: currentPage,
            pageSize: companiesPerPage,
            sortBy: 'name',
            sortOrder: 'asc',
        }),
        queryFn: async () => {
            const result = await apiClient.getCompanies({
                page: currentPage,
                pageSize: companiesPerPage,
                sortBy: 'name',
                sortOrder: 'asc',
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to load companies');
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

    // Transform companies data
    const companies: Company[] = companiesResponse
        ? companiesResponse.data.map((company) => ({
              ...company,
              domain: extractDomain(company.url),
              pages: company.pages || [],
              expanded: expandedCompanies.has(company.id),
          }))
        : [];

    const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showFirstPageDialog, setShowFirstPageDialog] = useState(false);
    const [newPageUrl, setNewPageUrl] = useState('');
    const [firstPageUrl, setFirstPageUrl] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyUrl, setNewCompanyUrl] = useState('');
    const [urlError, setUrlError] = useState<string>('');
    const [firstPageUrlError, setFirstPageUrlError] = useState<string>('');
    const [companyUrlError, setCompanyUrlError] = useState<string>('');
    const [isSubmittingPage, setIsSubmittingPage] = useState(false);
    const [isSubmittingFirstPage, setIsSubmittingFirstPage] = useState(false);

    // Mutations
    const deletePagesMutation = useMutation({
        mutationFn: async (pageIds: string[]) => {
            const result = await apiClient.deletePages({ pageIds });
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete pages');
            }
            return result;
        },
        onMutate: async (pageIds: string[]) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: queryKeys.companies() });

            // Snapshot the previous value
            const previousCompanies = queryClient.getQueryData(
                queryKeys.companies({
                    page: currentPage,
                    pageSize: companiesPerPage,
                    sortBy: 'name',
                    sortOrder: 'asc',
                }),
            );

            // Optimistically update by removing the deleted pages
            queryClient.setQueryData(
                queryKeys.companies({
                    page: currentPage,
                    pageSize: companiesPerPage,
                    sortBy: 'name',
                    sortOrder: 'asc',
                }),
                (old: unknown) => {
                    if (!old || typeof old !== 'object' || !('data' in old)) return old;

                    const typedOld = old as {
                        data: Array<{ id: string; pages?: Array<{ id: string }> }>;
                    };

                    return {
                        ...typedOld,
                        data: typedOld.data.map((company) => ({
                            ...company,
                            pages:
                                company.pages?.filter((page) => !pageIds.includes(page.id)) || [],
                        })),
                    };
                },
            );

            // Return a context object with the snapshotted value
            return { previousCompanies };
        },
        onSuccess: async () => {
            // Invalidate and refetch to get the latest data from server
            await queryClient.invalidateQueries({ queryKey: queryKeys.companies() });
            setSelectedPages(new Set());
            toast.success('Pages deleted successfully');
        },
        onError: (error: Error, variables, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousCompanies) {
                queryClient.setQueryData(
                    queryKeys.companies({
                        page: currentPage,
                        pageSize: companiesPerPage,
                        sortBy: 'name',
                        sortOrder: 'asc',
                    }),
                    context.previousCompanies,
                );
            }
            toast.error(error.message);
        },
    });

    const createPageMutation = useMutation({
        mutationFn: async (data: {
            page: { url: string };
            company: { id?: string; name?: string; url?: string };
        }) => {
            const result = await apiClient.createPage(data);
            if (!result.success) {
                throw new Error(result.error || 'Failed to create page');
            }
            return result;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.companies() });
            setNewPageUrl('');
            setSelectedCompanyId('');
            setNewCompanyName('');
            setNewCompanyUrl('');
            setShowAddDialog(false);
            setIsSubmittingPage(false);
            // Reset to first page after creating a new page
            setCurrentPage(1);
            toast.success('Page created successfully');
        },
        onError: (error: Error) => {
            setIsSubmittingPage(false);
            toast.error(error.message);
        },
    });

    const batchCreateMutation = useMutation({
        mutationFn: async (urls: string[]) => {
            const result = await apiClient.batchCreateCompanies({ urls });
            if (!result.success) {
                throw new Error(result.error || 'Failed to create page');
            }
            return result;
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.companies() });
            setFirstPageUrl('');
            setShowFirstPageDialog(false);
            setIsSubmittingFirstPage(false);
            // Reset to first page after creating first page
            setCurrentPage(1);

            if (data?.data?.errors && data.data.errors.length > 0) {
                toast.error(data.data.errors[0].error);
            } else {
                toast.success('Page created successfully');
            }
        },
        onError: (error: Error) => {
            setIsSubmittingFirstPage(false);
            toast.error(error.message);
        },
    });

    // Use server-side pagination data
    const totalPages = companiesResponse?.pagination?.totalPages || 1;
    const currentCompanies = companies;

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

    const togglePageSelection = (pageId: string) => {
        const newSelected = new Set(selectedPages);
        if (newSelected.has(pageId)) {
            newSelected.delete(pageId);
        } else {
            newSelected.add(pageId);
        }
        setSelectedPages(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedPages.size === 0) return;
        const pageIds = Array.from(selectedPages);
        deletePagesMutation.mutate(pageIds);
    };

    const handleAddPage = async () => {
        if (!newPageUrl || isSubmittingPage) return;

        setIsSubmittingPage(true);
        setUrlError('');

        // Validate URL format
        if (!validateUrl(newPageUrl)) {
            setUrlError("Looks like we're having trouble with this URL");
            setIsSubmittingPage(false);
            return;
        }

        // Validate company URL if creating a new company
        if (selectedCompanyId === 'create-new' && !validateUrl(newCompanyUrl)) {
            setCompanyUrlError("Looks like we're having trouble with this URL");
            setIsSubmittingPage(false);
            return;
        }

        const normalizedUrl = normalizeUrl(newPageUrl);

        if (selectedCompanyId === 'create-new') {
            if (!newCompanyName || !newCompanyUrl) {
                setIsSubmittingPage(false);
                return;
            }

            const normalizedCompanyUrl = normalizeUrl(newCompanyUrl);
            createPageMutation.mutate({
                page: { url: normalizedUrl },
                company: { name: newCompanyName, url: normalizedCompanyUrl },
            });
        } else if (selectedCompanyId) {
            createPageMutation.mutate({
                page: { url: normalizedUrl },
                company: { id: selectedCompanyId },
            });
        }
    };

    const handleAddFirstPage = async () => {
        if (!firstPageUrl || isSubmittingFirstPage) return;

        setIsSubmittingFirstPage(true);
        setFirstPageUrlError('');

        // Validate URL format
        if (!validateUrl(firstPageUrl)) {
            setFirstPageUrlError("Looks like we're having trouble with this URL.");
            setIsSubmittingFirstPage(false);
            return;
        }

        const normalizedUrl = normalizeUrl(firstPageUrl);

        batchCreateMutation.mutate([normalizedUrl]);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        // Reset expanded companies when changing pages
        setExpandedCompanies(new Set());
    };

    if (loading) {
        return (
            <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Almost there...</span>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">Failed to load companies</div>
                    <button
                        onClick={() => {
                            setCurrentPage(1);
                            queryClient.invalidateQueries({ queryKey: queryKeys.companies() });
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
                        <h1 className="text-xl font-semibold text-gray-900">Companies</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage your Companies</p>
                    </div>
                    {companies.length > 0 && (
                        <>
                            {selectedPages.size > 0 ? (
                                <Button
                                    onClick={handleBulkDelete}
                                    disabled={deletePagesMutation.isPending}
                                    className="bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center space-x-2 w-full sm:w-auto"
                                >
                                    {deletePagesMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    <span>Delete Page{selectedPages.size > 1 ? 's' : ''}</span>
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setShowAddDialog(true)}
                                    className="bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center space-x-2 w-full sm:w-auto"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add Page</span>
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {companies.length === 0 ? (
                    <div className="text-center py-12">
                        {/* <div className="text-gray-500 mb-4">
                            Looks like you don&apos;t have any companies yet
                        </div> */}
                        <Button
                            onClick={() => setShowFirstPageDialog(true)}
                            className="bg-gray-900 hover:bg-gray-800 text-white h-12"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first company
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Companies List */}
                        <div className="space-y-4">
                            {currentCompanies.map((company) => (
                                <div key={company.id}>
                                    {/* Company Header */}
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                            <ImageWithFallback
                                                src={getFaviconUrl(company.domain)}
                                                alt={`${company.name} favicon`}
                                                width={24}
                                                height={24}
                                                className="w-6 h-6"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {company.name}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {company.url}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            {company.pages.length > 0 ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => toggleExpanded(company.id)}
                                                >
                                                    {company.expanded ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pages */}
                                    {company.expanded && company.pages.length > 0 && (
                                        <div className="ml-6 md:ml-9 space-y-3 mb-4">
                                            {company.pages.map((page) => (
                                                <div
                                                    key={page.id}
                                                    className="group flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2"
                                                >
                                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPages.has(page.id)}
                                                            onChange={() =>
                                                                togglePageSelection(page.id)
                                                            }
                                                            className={`w-4 h-4 accent-black rounded transition-opacity flex-shrink-0 ${
                                                                selectedPages.has(page.id)
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0 group-hover:opacity-100'
                                                            }`}
                                                        />
                                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <a
                                                            href={page.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="min-w-0 flex-1 hover:text-blue-600 transition-colors cursor-pointer"
                                                        >
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {page.title}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                                {page.url}
                                                                <ArrowUpRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                            </div>
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (companiesResponse?.pagination?.totalItems ?? 0) > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 pt-6 space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-600 text-center sm:text-left">
                                    Showing{' '}
                                    {companiesResponse?.pagination?.page
                                        ? (companiesResponse.pagination.page - 1) *
                                              companiesPerPage +
                                          1
                                        : 1}
                                    -
                                    {Math.min(
                                        companiesResponse?.pagination?.page
                                            ? companiesResponse.pagination.page * companiesPerPage
                                            : companiesPerPage,
                                        companiesResponse?.pagination?.totalItems || 0,
                                    )}{' '}
                                    of {companiesResponse?.pagination?.totalItems || 0} companies
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
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                            (page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        currentPage === page ? 'default' : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className={`w-8 h-8 p-0 ${
                                                        currentPage === page
                                                            ? 'bg-gray-900 hover:bg-gray-800 text-white'
                                                            : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </Button>
                                            ),
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
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

                {/* Add Page Dialog */}
                <Dialog
                    open={showAddDialog}
                    onOpenChange={(open) => {
                        setShowAddDialog(open);
                        if (!open) {
                            // Reset all form fields when dialog closes
                            setNewPageUrl('');
                            setSelectedCompanyId('');
                            setNewCompanyName('');
                            setNewCompanyUrl('');
                            setUrlError('');
                            setCompanyUrlError('');
                            setIsSubmittingPage(false);
                        }
                    }}
                >
                    <DialogContent className="bg-white shadow-lg mx-4 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-900">
                                Add New Page
                            </DialogTitle>
                            <DialogDescription>
                                You can add it to an existing company or create a new one.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label
                                    htmlFor="page-url"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Page URL
                                </Label>
                                <URLInput
                                    id="page-url"
                                    value={newPageUrl}
                                    onChange={(value) => {
                                        setNewPageUrl(value);
                                        setUrlError('');
                                    }}
                                    placeholder="stripe.com/pricing"
                                    error={!!urlError}
                                    className="mt-1"
                                />
                                {urlError && (
                                    <p className="text-sm text-red-600 mt-1">{urlError}</p>
                                )}
                            </div>
                            {selectedCompanyId !== 'create-new' && (
                                <div>
                                    <Label
                                        htmlFor="company-select"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Select Company
                                    </Label>
                                    <Select
                                        value={selectedCompanyId}
                                        onValueChange={(value) => {
                                            setSelectedCompanyId(value);
                                            if (value !== 'create-new') {
                                                setNewCompanyName('');
                                                setNewCompanyUrl('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Choose a company" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="create-new">
                                                + Create new company
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedCompanyId === 'create-new' && (
                                <div className="mt-3 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                                        <div className="flex-1">
                                            <Label
                                                htmlFor="company-name"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Company Name
                                            </Label>
                                            <Input
                                                id="company-name"
                                                value={newCompanyName}
                                                onChange={(e) => setNewCompanyName(e.target.value)}
                                                placeholder="Stripe"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label
                                                htmlFor="company-url"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Company URL
                                            </Label>
                                            <URLInput
                                                id="company-url"
                                                value={newCompanyUrl}
                                                onChange={(value) => {
                                                    setNewCompanyUrl(value);
                                                    setCompanyUrlError('');
                                                }}
                                                placeholder="stripe.com"
                                                error={!!companyUrlError}
                                                className="mt-1"
                                            />
                                            {companyUrlError && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {companyUrlError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAddDialog(false)}
                                    disabled={createPageMutation.isPending || isSubmittingPage}
                                    className="hover:bg-gray-50 w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddPage}
                                    disabled={
                                        createPageMutation.isPending ||
                                        isSubmittingPage ||
                                        !newPageUrl ||
                                        (selectedCompanyId === 'create-new' &&
                                            (!newCompanyName || !newCompanyUrl))
                                    }
                                    className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto"
                                >
                                    {createPageMutation.isPending || isSubmittingPage ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Add Page'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add First Page Dialog */}
                <Dialog
                    open={showFirstPageDialog}
                    onOpenChange={(open) => {
                        setShowFirstPageDialog(open);
                        if (!open) {
                            // Reset form fields when dialog closes
                            setFirstPageUrl('');
                            setFirstPageUrlError('');
                            setIsSubmittingFirstPage(false);
                        }
                    }}
                >
                    <DialogContent className="bg-white shadow-lg mx-4 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-900">
                                Add Your First Page
                            </DialogTitle>
                            <DialogDescription>We&apos;ll keep you in the loop</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label
                                    htmlFor="first-page-url"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Page URL
                                </Label>
                                <URLInput
                                    id="first-page-url"
                                    value={firstPageUrl}
                                    onChange={(value) => {
                                        setFirstPageUrl(value);
                                        setFirstPageUrlError('');
                                    }}
                                    placeholder="stripe.com/pricing"
                                    error={!!firstPageUrlError}
                                    className="mt-1"
                                />
                                {firstPageUrlError && (
                                    <p className="text-sm text-red-600 mt-1">{firstPageUrlError}</p>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFirstPageDialog(false)}
                                    disabled={
                                        batchCreateMutation.isPending || isSubmittingFirstPage
                                    }
                                    className="hover:bg-gray-50 w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddFirstPage}
                                    disabled={
                                        batchCreateMutation.isPending ||
                                        isSubmittingFirstPage ||
                                        !firstPageUrl
                                    }
                                    className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto"
                                >
                                    {batchCreateMutation.isPending || isSubmittingFirstPage ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Add Page'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
