'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

interface BriefingContentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    briefing: {
        id: string;
        companyName: string;
        contentUrl: string;
        createdAt: Date | string;
    } | null;
}

export function BriefingContentDialog({
    open,
    onOpenChange,
    briefing,
}: BriefingContentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="mb-1">{briefing && briefing.companyName}</DialogTitle>
                    {briefing && (
                        <p className="text-sm text-gray-600">{formatDate(briefing.createdAt)}</p>
                    )}
                </DialogHeader>
                <div className="p-6 pt-2 pb-4 h-[75vh]">
                    {briefing && (
                        <iframe
                            src={briefing.contentUrl}
                            className="w-full h-full border-2 rounded-lg"
                            title={`Briefing content for ${briefing.companyName}`}
                            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation-by-user-activation"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
