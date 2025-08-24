import { LucideIcon } from 'lucide-react';

interface SelectionItemProps {
    label: string;
    icon: LucideIcon;
    isSelected: boolean;
    onClick: () => void;
    selectionType?: 'radio' | 'checkbox';
}

export const SelectionItem = ({
    label,
    icon: Icon,
    isSelected,
    onClick,
    selectionType = 'radio',
}: SelectionItemProps) => {
    return (
        <div
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm">{label}</span>
            </div>

            {selectionType === 'radio' ? (
                <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                    }`}
                >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
            ) : (
                <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                    }`}
                >
                    {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>
            )}
        </div>
    );
};
