'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/sidebar';
import { SettingsView } from '@/components/settings-view';
import { PagesView } from '@/components/pages-view';
import { ChevronDown } from 'lucide-react';
import { MobileAvatar } from '@/components/avatar';
import { apiClient } from '@/client/api';
import { queryKeys } from '@/lib/query-keys';
import { DashboardPaywallView } from '@/components/DashboardPaywallView';
import PagesViewSkeleton from '@/components/skeleton/skeleton-pages-view';

export default function Dashboard() {
    const [activeView, setActiveView] = useState('pages');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Fetch payment status
    const {
        data: paymentStatus,
        isLoading,
        error,
    } = useQuery({
        queryKey: queryKeys.paymentStatus(),
        queryFn: () => apiClient.getPaymentStatus(),
        retry: 2,
    });

    // Show toast on error
    useEffect(() => {
        if (error) {
            console.error('Dashboard error:', error);
        }
    }, [error]);

    // Check if user has active subscription
    const hasActiveSubscription =
        paymentStatus?.success &&
        paymentStatus.data?.subscriptionId &&
        paymentStatus.data?.plan &&
        paymentStatus.data?.status === 'active';

    const renderContent = () => {
        // Show skeleton loading state
        if (isLoading) {
            return <PagesViewSkeleton />;
        }

        // Show minimal error state with skeleton fallback
        if (error) {
            return <PagesViewSkeleton />;
        }

        // Show DashboardPaywallView if no active subscription
        if (!hasActiveSubscription) {
            return <DashboardPaywallView paymentStatus={paymentStatus?.data || null} />;
        }

        // Show dashboard content for users with active subscription
        switch (activeView) {
            case 'settings':
                return <SettingsView />;
            case 'pages':
                return <PagesView />;
            default:
                return <PagesView />;
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            <div className="md:hidden bg-white px-4 py-3 flex items-center justify-between shadow-sm">
                {/* Left side - Subsignal logo with dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-2 text-xl font-semibold text-gray-900"
                    >
                        <span>Subsignal</span>
                        <ChevronDown className="h-4 w-4" />
                    </button>

                    {/* Dropdown menu */}
                    {dropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md py-1 z-20">
                                <button
                                    onClick={() => {
                                        setActiveView('pages');
                                        setDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                                        activeView === 'pages'
                                            ? 'text-gray-900 bg-gray-50'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    Companies
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveView('settings');
                                        setDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                                        activeView === 'settings'
                                            ? 'text-gray-900 bg-gray-50'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    Settings
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right side - Avatar */}
                <div className="flex items-center">
                    <MobileAvatar />
                </div>
            </div>

            <div className="hidden md:block">
                <Sidebar activeView={activeView} onViewChange={setActiveView} />
            </div>

            <div className="flex-1">{renderContent()}</div>
        </div>
    );
}
