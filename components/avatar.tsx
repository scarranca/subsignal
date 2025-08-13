'use client';

export function Avatar() {
    return (
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">OM</span>
            </div>
            <div className="text-sm">
                <div className="font-medium text-gray-900">Olivia Martin</div>
                <div className="text-gray-500">olivia.martin@email.com</div>
            </div>
        </div>
    );
}
