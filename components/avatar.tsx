'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HelpCircle, LogOut } from 'lucide-react';
import { authClient } from '@/client/auth';
import { showToast } from '@/lib/toast';
import { AVATAR_COLORS, AVATAR_VARIANT } from '@/constants/palette';
import BoringAvatar from 'boring-avatars';

// Common dropdown menu content
function UserDropdownMenu({ onSignOut }: { onSignOut: () => void }) {
    return (
        <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg w-56">
            <DropdownMenuItem className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem
                className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                onClick={onSignOut}
            >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
    );
}

// Separate Avatar component for mobile use
export function Avatar() {
    const { data: session } = authClient.useSession();

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error signing out:', error);
            showToast.error('Failed to sign out. Please try again.');
        }
    };

    const userName = session?.user?.name || 'Anonymous User';
    const userEmail = session?.user?.email || 'user@example.com';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg transition-colors w-full p-2">
                    <BoringAvatar
                        name={userName}
                        colors={AVATAR_COLORS}
                        variant={AVATAR_VARIANT}
                        size={32}
                    />
                    <div className="text-sm text-left flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{userName}</div>
                        <div className="text-sm text-gray-600 truncate">{userEmail}</div>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <UserDropdownMenu onSignOut={handleSignOut} />
        </DropdownMenu>
    );
}

// Mobile-only Avatar component (smaller, no text)
export function MobileAvatar() {
    const { data: session } = authClient.useSession();

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error signing out:', error);
            showToast.error('Failed to sign out. Please try again.');
        }
    };

    const userName = session?.user?.name || 'Anonymous User';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center hover:bg-gray-50 rounded-lg transition-colors p-1">
                    <BoringAvatar
                        name={userName}
                        colors={AVATAR_COLORS}
                        variant={AVATAR_VARIANT}
                        size={32}
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="bg-white border border-gray-200 shadow-lg w-48"
            >
                <UserDropdownMenu onSignOut={handleSignOut} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
