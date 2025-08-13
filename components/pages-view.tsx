'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, Trash2, ChevronLeft } from 'lucide-react';
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

interface Page {
    id: number;
    title: string;
    url: string;
}

interface Company {
    id: number;
    name: string;
    domain: string;
    pages: Page[];
    expanded: boolean;
}

export function PagesView() {
    const [companies, setCompanies] = useState<Company[]>([
        {
            id: 1,
            name: 'Stripe',
            domain: 'stripe.com',
            pages: [
                { id: 1, title: 'Pricing', url: 'https://stripe.com/pricing' },
                { id: 2, title: 'Documentation', url: 'https://stripe.com/docs' },
                { id: 3, title: 'Connect', url: 'https://stripe.com/connect' },
                { id: 4, title: 'Atlas', url: 'https://stripe.com/atlas' },
            ],
            expanded: false,
        },
        {
            id: 2,
            name: 'Square',
            domain: 'squareup.com',
            pages: [
                { id: 5, title: 'Point of Sale', url: 'https://squareup.com/us/en/point-of-sale' },
                { id: 6, title: 'Payments', url: 'https://squareup.com/us/en/payments' },
                { id: 7, title: 'Banking', url: 'https://squareup.com/us/en/banking' },
            ],
            expanded: false,
        },
        {
            id: 3,
            name: 'PayPal',
            domain: 'paypal.com',
            pages: [
                { id: 8, title: 'Business Solutions', url: 'https://paypal.com/us/business' },
                { id: 9, title: 'Developer', url: 'https://developer.paypal.com' },
            ],
            expanded: false,
        },
        {
            id: 4,
            name: 'Coinbase',
            domain: 'coinbase.com',
            pages: [
                { id: 10, title: 'Pro Trading', url: 'https://pro.coinbase.com' },
                { id: 11, title: 'Commerce', url: 'https://commerce.coinbase.com' },
                { id: 12, title: 'Wallet', url: 'https://wallet.coinbase.com' },
            ],
            expanded: false,
        },
        {
            id: 5,
            name: 'Robinhood',
            domain: 'robinhood.com',
            pages: [
                { id: 13, title: 'Investing', url: 'https://robinhood.com/us/en/invest' },
                { id: 14, title: 'Crypto', url: 'https://robinhood.com/us/en/crypto' },
                { id: 15, title: 'Gold', url: 'https://robinhood.com/us/en/gold' },
            ],
            expanded: false,
        },
        {
            id: 6,
            name: 'Plaid',
            domain: 'plaid.com',
            pages: [
                { id: 16, title: 'Products', url: 'https://plaid.com/products' },
                { id: 17, title: 'Developers', url: 'https://plaid.com/docs' },
            ],
            expanded: false,
        },
        {
            id: 7,
            name: 'Klarna',
            domain: 'klarna.com',
            pages: [
                { id: 18, title: 'Business', url: 'https://klarna.com/business' },
                { id: 19, title: 'Shopping', url: 'https://klarna.com/us/shopping' },
            ],
            expanded: false,
        },
        {
            id: 8,
            name: 'Affirm',
            domain: 'affirm.com',
            pages: [
                { id: 20, title: 'Business', url: 'https://affirm.com/business' },
                { id: 21, title: 'How it Works', url: 'https://affirm.com/how-it-works' },
            ],
            expanded: false,
        },
    ]);

    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [newPageUrl, setNewPageUrl] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyUrl, setNewCompanyUrl] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const companiesPerPage = 4;

    const totalPages = Math.ceil(companies.length / companiesPerPage);
    const startIndex = (currentPage - 1) * companiesPerPage;
    const endIndex = startIndex + companiesPerPage;
    const currentCompanies = companies.slice(startIndex, endIndex);

    const toggleExpanded = (id: number) => {
        setCompanies(
            companies.map((company) =>
                company.id === id ? { ...company, expanded: !company.expanded } : company,
            ),
        );
    };

    const getFaviconUrl = (domain: string) => {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    };

    const togglePageSelection = (pageId: number) => {
        const newSelected = new Set(selectedPages);
        if (newSelected.has(pageId)) {
            newSelected.delete(pageId);
        } else {
            newSelected.add(pageId);
        }
        setSelectedPages(newSelected);
    };

    const handleBulkDelete = () => {
        setCompanies(
            companies.map((company) => ({
                ...company,
                pages: company.pages.filter((page) => !selectedPages.has(page.id)),
            })),
        );
        setSelectedPages(new Set());
    };

    const handleAddPage = () => {
        if (!newPageTitle || !newPageUrl) return;

        if (selectedCompanyId === 'create-new' && newCompanyName && newCompanyUrl) {
            const newCompany: Company = {
                id: Math.max(...companies.map((c) => c.id)) + 1,
                name: newCompanyName,
                domain: new URL(newCompanyUrl).hostname,
                pages: [
                    {
                        id: Math.max(...companies.flatMap((c) => c.pages.map((p) => p.id))) + 1,
                        title: newPageTitle,
                        url: newPageUrl,
                    },
                ],
                expanded: true,
            };
            setCompanies([...companies, newCompany]);
        } else if (selectedCompanyId) {
            const newPage: Page = {
                id: Math.max(...companies.flatMap((c) => c.pages.map((p) => p.id))) + 1,
                title: newPageTitle,
                url: newPageUrl,
            };
            setCompanies(
                companies.map((company) =>
                    company.id === Number.parseInt(selectedCompanyId)
                        ? { ...company, pages: [...company.pages, newPage] }
                        : company,
                ),
            );
        }

        // Reset form
        setNewPageTitle('');
        setNewPageUrl('');
        setSelectedCompanyId('');
        setNewCompanyName('');
        setNewCompanyUrl('');
        setShowAddDialog(false);
    };

    // Removed unused function deletePage

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
                            className="bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center space-x-2 w-full sm:w-auto"
                        >
                            <Trash2 className="h-4 w-4" />
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

                {/* Companies List */}
                <div className="space-y-4">
                    {currentCompanies.map((company) => (
                        <div key={company.id}>
                            {/* Company Header */}
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <Image
                                        src={getFaviconUrl(company.domain) || '/placeholder.svg'}
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
                                            https://{company.domain}
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
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                                                    onChange={() => togglePageSelection(page.id)}
                                                    className={`w-4 h-4 accent-black rounded transition-opacity flex-shrink-0 ${
                                                        selectedPages.has(page.id)
                                                            ? 'opacity-100'
                                                            : 'opacity-0 group-hover:opacity-100'
                                                    }`}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                        {company.name}: {page.title}
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
                            Showing {startIndex + 1}-{Math.min(endIndex, companies.length)} of{' '}
                            {companies.length} companies
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
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? 'default' : 'outline'}
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
                                ))}
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

                {/* Add Page Dialog */}
                <Dialog
                    open={showAddDialog}
                    onOpenChange={(open) => {
                        setShowAddDialog(open);
                        if (!open) {
                            // Reset all form fields when dialog closes
                            setNewPageTitle('');
                            setNewPageUrl('');
                            setSelectedCompanyId('');
                            setNewCompanyName('');
                            setNewCompanyUrl('');
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
                                    htmlFor="page-title"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Page Title
                                </Label>
                                <Input
                                    id="page-title"
                                    value={newPageTitle}
                                    onChange={(e) => setNewPageTitle(e.target.value)}
                                    placeholder="Enter page title"
                                    className="mt-1"
                                />
                            </div>
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
                                    onChange={(e) => setNewPageUrl(e.target.value)}
                                    placeholder="https://example.com/page"
                                    className="mt-1"
                                />
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
                                            setNewCompanyName(
                                                value === 'create-new' ? '' : newCompanyName,
                                            );
                                            setNewCompanyUrl(
                                                value === 'create-new' ? '' : newCompanyUrl,
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Choose a company" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {companies.map((company) => (
                                                <SelectItem
                                                    key={company.id}
                                                    value={company.id.toString()}
                                                >
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
                                                onChange={(e) => setNewCompanyUrl(e.target.value)}
                                                placeholder="https://company.com"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAddDialog(false)}
                                    className="hover:bg-gray-50 w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddPage}
                                    className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto"
                                    disabled={
                                        !newPageTitle ||
                                        !newPageUrl ||
                                        (selectedCompanyId === 'create-new' &&
                                            (!newCompanyName || !newCompanyUrl))
                                    }
                                >
                                    Add Page
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
