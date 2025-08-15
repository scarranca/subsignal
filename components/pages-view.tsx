'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
    ChevronLeft,
    Loader2,
    FileText,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

interface Company extends Omit<ApiCompany, 'pages'> {
    domain: string;
    pages: ApiPage[];
    expanded: boolean;
}

// Validate URL with flexible input (using centralized utility)
const validateUrl = (url: string): boolean => {
    return isValidUrl(url);
};

// Verify that URL is reachable
const verifyUrl = async (url: string): Promise<boolean> => {
    try {
        const normalizedUrl = normalizeUrl(url);

        // Don't try to verify invalid URLs
        if (!isValidUrl(normalizedUrl)) {
            return false;
        }

        await fetch(normalizedUrl, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: AbortSignal.timeout(5000),
        });
        return true;
    } catch {
        return false;
    }
};

export function PagesView() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newPageUrl, setNewPageUrl] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyUrl, setNewCompanyUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [urlError, setUrlError] = useState<string>('');
    const [companyUrlError, setCompanyUrlError] = useState<string>('');

    const [currentPage, setCurrentPage] = useState(1);
    const companiesPerPage = 4;

    const loadCompanies = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiClient.getCompanies({
                page: 1,
                pageSize: 100, // Get all companies for now
                sortBy: 'name',
                sortOrder: 'asc',
            });

            if (result.success && result.data) {
                const companiesWithDomain: Company[] = result.data.data.map((company) => ({
                    ...company,
                    domain: extractDomain(company.url),
                    pages: company.pages || [],
                    expanded: false,
                }));
                setCompanies(companiesWithDomain);
            } else {
                toast.error(result.error || 'Failed to load companies');
            }
        } catch (error) {
            console.error('Error loading companies:', error);
            toast.error('Failed to load companies');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load companies and pages on component mount
    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const extractDomain = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    const totalPages = Math.ceil(companies.length / companiesPerPage);
    const startIndex = (currentPage - 1) * companiesPerPage;
    const endIndex = startIndex + companiesPerPage;
    const currentCompanies = companies.slice(startIndex, endIndex);

    const toggleExpanded = (id: string) => {
        setCompanies((prevCompanies) =>
            prevCompanies.map((company) =>
                company.id === id ? { ...company, expanded: !company.expanded } : company,
            ),
        );
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

        try {
            setDeleting(true);
            const pageIds = Array.from(selectedPages);
            const result = await apiClient.deletePages({ pageIds });

            if (result.success) {
                toast.success(
                    `Successfully deleted ${pageIds.length} page${pageIds.length > 1 ? 's' : ''}`,
                );
                setSelectedPages(new Set());
                // Reload companies to reflect changes
                await loadCompanies();
            } else {
                toast.error(result.error || 'Failed to delete pages');
            }
        } catch (error) {
            console.error('Error deleting pages:', error);
            toast.error('Failed to delete pages');
        } finally {
            setDeleting(false);
        }
    };

    const handleAddPage = async () => {
        if (!newPageUrl) return;

        try {
            setSubmitting(true);
            setUrlError('');

            // Validate URL format
            if (!validateUrl(newPageUrl)) {
                setUrlError(
                    'Please enter a valid public website. Examples: stripe.com, https://stripe.com, http://example.org (localhost and internal IPs not allowed)',
                );
                setSubmitting(false);
                return;
            }

            // Validate company URL if creating a new company
            if (selectedCompanyId === 'create-new' && !validateUrl(newCompanyUrl)) {
                setCompanyUrlError(
                    'Please enter a valid public website. Examples: stripe.com, https://stripe.com, http://example.org (localhost and internal IPs not allowed)',
                );
                setSubmitting(false);
                return;
            }

            // Verify URL is reachable
            const normalizedUrl = normalizeUrl(newPageUrl);
            const isReachable = await verifyUrl(normalizedUrl);
            if (!isReachable) {
                setUrlError('Unable to reach this website. Please check the URL and try again.');
                setSubmitting(false);
                return;
            }

            let result;

            if (selectedCompanyId === 'create-new') {
                if (!newCompanyName || !newCompanyUrl) return;

                // Normalize company URL as well
                const normalizedCompanyUrl = normalizeUrl(newCompanyUrl);

                result = await apiClient.createPage({
                    page: {
                        url: normalizedUrl,
                        // Title will be auto-fetched on the server
                    },
                    company: {
                        name: newCompanyName,
                        url: normalizedCompanyUrl,
                    },
                });
            } else if (selectedCompanyId) {
                result = await apiClient.createPage({
                    page: {
                        url: normalizedUrl,
                        // Title will be auto-fetched on the server
                    },
                    company: {
                        id: selectedCompanyId,
                    },
                });
            }

            if (result?.success) {
                toast.success('Page created successfully');
                // Reset form
                setNewPageUrl('');
                setSelectedCompanyId('');
                setNewCompanyName('');
                setNewCompanyUrl('');
                setShowAddDialog(false);
                // Reload companies to reflect changes
                await loadCompanies();
            } else {
                toast.error(result?.error || 'Failed to create page');
            }
        } catch (error) {
            console.error('Error creating page:', error);
            toast.error('Failed to create page');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading companies...</span>
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
                    {selectedPages.size > 0 ? (
                        <Button
                            onClick={handleBulkDelete}
                            disabled={deleting}
                            className="bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center space-x-2 w-full sm:w-auto"
                        >
                            {deleting ? (
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
                </div>

                {companies.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">No companies found</div>
                        <Button
                            onClick={() => setShowAddDialog(true)}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first page
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
                                            <Image
                                                src={getFaviconUrl(company.domain)}
                                                alt={`${company.name} favicon`}
                                                width={24}
                                                height={24}
                                                className="w-6 h-6 rounded flex-shrink-0"
                                                onError={(e) => {
                                                    // Fallback to black box if favicon fails to load
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove(
                                                        'hidden',
                                                    );
                                                }}
                                            />
                                            <div className="w-6 h-6 bg-gray-900 rounded items-center justify-center hidden flex-shrink-0">
                                                <div className="w-3 h-3 bg-white rounded-sm"></div>
                                            </div>
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
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {page.title}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {page.url}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 pt-6 space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-600 text-center sm:text-left">
                                    Showing {startIndex + 1}-{Math.min(endIndex, companies.length)}{' '}
                                    of {companies.length} companies
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(currentPage - 1)}
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
                                                    onClick={() => setCurrentPage(page)}
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
                                        onClick={() => setCurrentPage(currentPage + 1)}
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
                        }
                    }}
                >
                    <DialogContent className="bg-white shadow-lg mx-4 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-900">
                                Add New Page
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label
                                    htmlFor="page-url"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Page URL
                                </Label>
                                <Input
                                    id="page-url"
                                    value={newPageUrl}
                                    onChange={(e) => {
                                        setNewPageUrl(e.target.value);
                                        setUrlError('');
                                    }}
                                    placeholder="stripe.com/pricing, https://stripe.com/pricing, or http://example.org"
                                    className={`mt-1 ${urlError ? 'border-red-500' : ''}`}
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
                                                placeholder="Enter company name"
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
                                            <Input
                                                id="company-url"
                                                value={newCompanyUrl}
                                                onChange={(e) => {
                                                    setNewCompanyUrl(e.target.value);
                                                    setCompanyUrlError('');
                                                }}
                                                placeholder="stripe.com, https://stripe.com, or http://example.org"
                                                className={`mt-1 ${companyUrlError ? 'border-red-500' : ''}`}
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
                                    disabled={submitting}
                                    className="hover:bg-gray-50 w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddPage}
                                    disabled={
                                        submitting ||
                                        !newPageUrl ||
                                        (selectedCompanyId === 'create-new' &&
                                            (!newCompanyName || !newCompanyUrl))
                                    }
                                    className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto"
                                >
                                    {submitting ? (
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
