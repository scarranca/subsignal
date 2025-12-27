'use client';

import { Avatar } from '@/components/avatar';
import {
    LayoutDashboard,
    Users,
    Building2,
    Target,
    MessageSquare,
    CheckSquare,
    Activity,
    Settings,
    Sparkles,
    FileText,
} from 'lucide-react';

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deals', label: 'Deals', icon: Target },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'activities', label: 'Activities', icon: Activity },
];

const secondaryNavItems = [
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'briefings', label: 'Briefings', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
    return (
        <div className="w-64 bg-white flex-shrink-0 flex flex-col shadow-lg md:shadow-none h-full border-r border-gray-100">
            {/* Header */}
            <div className="px-6 py-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Subsignal</h1>
                        <span className="text-xs text-gray-500">AI-Powered CRM</span>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto px-3">
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="my-4 border-t border-gray-100" />

                {/* Secondary Navigation */}
                <nav className="space-y-1">
                    {secondaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                {item.label}
                                {item.id === 'insights' && (
                                    <span className="ml-auto text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
                                        AI
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* User Avatar at bottom */}
            <div className="px-4 py-4 flex-shrink-0 border-t border-gray-100">
                <Avatar />
            </div>
        </div>
    );
}
