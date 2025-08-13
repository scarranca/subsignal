'use client';

import { AVATAR_COLORS, AVATAR_VARIANT } from '@/constants/palette';
import Avatar from 'boring-avatars';

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
    return (
        <div className="w-64 bg-white flex-shrink-0 flex flex-col shadow-lg md:shadow-none h-full">
            {/* Header */}
            <div className="px-6 py-6 flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">Subsignal</h1>
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
                <div className="flex items-center space-x-3">
                    <Avatar
                        name="Olivia Martin"
                        variant={AVATAR_VARIANT}
                        size={32}
                        colors={AVATAR_COLORS}
                    />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Olivia Martin</p>
                        <p className="text-xs text-gray-500">olivia.martin@email.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
