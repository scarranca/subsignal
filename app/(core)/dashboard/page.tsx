'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { SettingsView } from '@/components/settings-view';
import { PagesView } from '@/components/pages-view';
import { ChevronDown } from 'lucide-react';
import { MobileAvatar } from '@/components/avatar';

export default function Dashboard() {
    const [activeView, setActiveView] = useState('pages');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Removed unused function getViewDisplayName

    const renderContent = () => {
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
