'use client';

import { Avatar } from '@/components/avatar';

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
    return (
        <div className="w-64 bg-white flex-shrink-0 flex flex-col shadow-lg md:shadow-none h-full">
            {/* Header */}
            <div className="px-6 py-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-gray-900">Subsignal</h1>
                    <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-300"></div>
                        <span className="text-xs font-medium text-green-700">Live</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
                <nav className="px-6 space-y-1">
                    <button
                        onClick={() => onViewChange('pages')}
                        className={`w-full text-left px-0 py-2 text-sm font-medium transition-colors ${
                            activeView === 'pages'
                                ? 'text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Companies
                    </button>
                    <button
                        onClick={() => onViewChange('briefings')}
                        className={`w-full text-left px-0 py-2 text-sm font-medium transition-colors ${
                            activeView === 'briefings'
                                ? 'text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Briefings
                    </button>
                    <button
                        onClick={() => onViewChange('settings')}
                        className={`w-full text-left px-0 py-2 text-sm font-medium transition-colors ${
                            activeView === 'settings'
                                ? 'text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Settings
                    </button>
                </nav>
            </div>

            {/* User Avatar at bottom */}
            <div className="px-6 py-4 flex-shrink-0">
                <Avatar />
            </div>
        </div>
    );
}
