'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Loader2, Mail, X, Paperclip } from 'lucide-react';
import { apiClient } from '@/client';
import { toast } from 'sonner';

interface EmailComposerProps {
    isOpen: boolean;
    onClose: () => void;
    // Pre-fill options
    contactId?: string;
    contactEmail?: string;
    contactName?: string;
    dealId?: string;
    dealName?: string;
    companyId?: string;
    companyName?: string;
    // Thread reply
    threadId?: string;
    replySubject?: string;
}

export function EmailComposer({
    isOpen,
    onClose,
    contactId,
    contactEmail,
    contactName,
    dealId,
    dealName,
    companyId,
    companyName,
    threadId,
    replySubject,
}: EmailComposerProps) {
    const queryClient = useQueryClient();
    const [to, setTo] = useState(contactEmail || '');
    const [subject, setSubject] = useState(replySubject ? `Re: ${replySubject}` : '');
    const [body, setBody] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<string>('');

    // Fetch available integrations
    const { data: integrationsData } = useQuery({
        queryKey: ['integrations'],
        queryFn: () => apiClient.get('/api/v1/integrations').then((res) => res.json()),
        enabled: isOpen,
    });

    // Get Gmail-enabled integrations
    const gmailIntegrations = integrationsData?.integrations?.filter(
        (i: any) => i.provider === 'google' && i.gmailEnabled
    ) || [];

    // Set default integration
    useEffect(() => {
        if (gmailIntegrations.length > 0 && !selectedIntegration) {
            setSelectedIntegration(gmailIntegrations[0].id);
        }
    }, [gmailIntegrations, selectedIntegration]);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setTo(contactEmail || '');
            setSubject(replySubject ? `Re: ${replySubject}` : '');
            setBody('');
        }
    }, [isOpen, contactEmail, replySubject]);

    // Send email mutation
    const sendEmailMutation = useMutation({
        mutationFn: async () => {
            if (!selectedIntegration) {
                throw new Error('No Gmail integration selected');
            }

            const res = await apiClient.post(`/api/v1/integrations/${selectedIntegration}/send-email`, {
                body: JSON.stringify({
                    to,
                    subject,
                    body,
                    threadId,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to send email');
            }

            return res.json();
        },
        onSuccess: async (data) => {
            // Log as interaction if contact is linked
            if (contactId) {
                await apiClient.post('/api/v1/interactions', {
                    body: JSON.stringify({
                        type: 'email',
                        direction: 'outbound',
                        contactId,
                        companyId,
                        dealId,
                        subject,
                        notes: body.slice(0, 500),
                        occurredAt: new Date().toISOString(),
                        metadata: {
                            gmailMessageId: data.messageId,
                            gmailThreadId: data.threadId,
                        },
                    }),
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            queryClient.invalidateQueries({ queryKey: ['interactions'] });
            toast.success('Email sent successfully');
            onClose();
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to send email');
        },
    });

    // Generate AI follow-up email
    const generateFollowUp = async () => {
        if (!dealId && !contactId) {
            toast.error('Need a contact or deal to generate follow-up');
            return;
        }

        setIsGenerating(true);
        try {
            const res = await apiClient.post('/api/v1/ai/follow-up-email', {
                body: JSON.stringify({
                    contactId,
                    dealId,
                    context: `${dealName ? `Deal: ${dealName}. ` : ''}${companyName ? `Company: ${companyName}. ` : ''}`,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error('Failed to generate email');
            }

            const data = await res.json();
            setSubject(data.subject || subject);
            setBody(data.body || '');
            toast.success('AI draft generated');
        } catch (error) {
            toast.error('Failed to generate follow-up email');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSend = () => {
        if (!to) {
            toast.error('Please enter a recipient email');
            return;
        }
        if (!subject) {
            toast.error('Please enter a subject');
            return;
        }
        if (!body) {
            toast.error('Please enter a message');
            return;
        }
        sendEmailMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Compose Email
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Context badges */}
                    {(dealName || contactName || companyName) && (
                        <div className="flex flex-wrap gap-2">
                            {contactName && (
                                <Badge variant="secondary" className="gap-1">
                                    Contact: {contactName}
                                </Badge>
                            )}
                            {dealName && (
                                <Badge variant="secondary" className="gap-1">
                                    Deal: {dealName}
                                </Badge>
                            )}
                            {companyName && (
                                <Badge variant="secondary" className="gap-1">
                                    Company: {companyName}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* From (Integration selector) */}
                    {gmailIntegrations.length > 0 && (
                        <div>
                            <Label>From</Label>
                            <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {gmailIntegrations.map((integration: any) => (
                                        <SelectItem key={integration.id} value={integration.id}>
                                            {integration.connectedEmail}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {gmailIntegrations.length === 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            <p className="font-medium">Gmail not connected</p>
                            <p>Connect your Gmail account in Settings &gt; Integrations to send emails.</p>
                        </div>
                    )}

                    {/* To */}
                    <div>
                        <Label>To</Label>
                        <Input
                            type="email"
                            placeholder="recipient@example.com"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <Label>Subject</Label>
                        <Input
                            placeholder="Email subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label>Message</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={generateFollowUp}
                                disabled={isGenerating || (!dealId && !contactId)}
                                className="gap-1 text-xs"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3" />
                                )}
                                AI Draft
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Write your message..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={10}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sendEmailMutation.isPending || gmailIntegrations.length === 0}
                        className="gap-2"
                    >
                        {sendEmailMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Send Email
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Hook to manage email composer state
 */
export function useEmailComposer() {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<Partial<EmailComposerProps>>({});

    const openComposer = (ctx: Partial<EmailComposerProps> = {}) => {
        setContext(ctx);
        setIsOpen(true);
    };

    const closeComposer = () => {
        setIsOpen(false);
        setContext({});
    };

    return {
        isOpen,
        context,
        openComposer,
        closeComposer,
    };
}
