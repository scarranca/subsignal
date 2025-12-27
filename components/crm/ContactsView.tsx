'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Plus,
    Search,
    Mail,
    Phone,
    Building2,
    Linkedin,
    User,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { apiClient } from '@/client';
import { toast } from 'sonner';
import { OrganizationOnboarding } from './OrganizationOnboarding';

interface ContactsViewProps {
    onNavigate?: (view: string, params?: any) => void;
}

export function ContactsView({ onNavigate }: ContactsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const queryClient = useQueryClient();

    // Create contact form state
    const [newFirstName, setNewFirstName] = useState('');
    const [newLastName, setNewLastName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDepartment, setNewDepartment] = useState('');
    const [newSource, setNewSource] = useState<'manual' | 'import' | 'linkedin' | 'referral' | 'website'>('manual');

    // Check for organization
    const { data: orgData, isLoading: orgLoading } = useQuery({
        queryKey: ['current-organization'],
        queryFn: async () => {
            const res = await apiClient.get('/api/v1/organizations/current');
            if (!res.ok) return null;
            return res.json();
        },
    });

    // Fetch contacts
    const { data: contactsData, isLoading } = useQuery({
        queryKey: ['contacts', { search: searchQuery }],
        queryFn: () =>
            apiClient
                .get(`/api/v1/contacts?search=${encodeURIComponent(searchQuery)}&pageSize=50`)
                .then((res) => res.json()),
    });

    // Generate AI insights mutation
    const generateInsightsMutation = useMutation({
        mutationFn: async (contactId: string) => {
            const res = await apiClient.post('/api/v1/ai/contacts/insights', {
                body: JSON.stringify({ contactId }),
                headers: { 'Content-Type': 'application/json' },
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast.success('AI insights generated');
            setSelectedContact((prev: any) => ({ ...prev, aiInsights: data }));
        },
        onError: () => {
            toast.error('Failed to generate insights');
        },
    });

    // Create contact mutation
    const createContactMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/api/v1/contacts', {
                body: JSON.stringify({
                    firstName: newFirstName,
                    lastName: newLastName,
                    email: newEmail || null,
                    phone: newPhone || null,
                    title: newTitle || null,
                    department: newDepartment || null,
                    source: newSource,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create contact');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setShowCreateDialog(false);
            resetCreateForm();
            toast.success('Contact created successfully');
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to create contact');
        },
    });

    const resetCreateForm = () => {
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewPhone('');
        setNewTitle('');
        setNewDepartment('');
        setNewSource('manual');
    };

    const contacts = contactsData?.data || [];

    // Show loading state while checking organization
    if (orgLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Show onboarding if no organization
    if (!orgData) {
        return <OrganizationOnboarding />;
    }

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-40 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                    <p className="text-gray-500 mt-1">
                        {contactsData?.pagination?.totalItems || 0} contacts
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Contact
                    </Button>
                </div>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact: any) => (
                    <Card
                        key={contact.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedContact(contact)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    {contact.avatarUrl ? (
                                        <img
                                            src={contact.avatarUrl}
                                            alt={contact.firstName}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-6 h-6 text-indigo-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {contact.firstName} {contact.lastName}
                                    </h3>
                                    {contact.title && (
                                        <p className="text-sm text-gray-500 truncate">{contact.title}</p>
                                    )}
                                    {contact.company && (
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <Building2 className="w-3 h-3" />
                                            <span className="truncate">{contact.company.name}</span>
                                        </div>
                                    )}
                                </div>
                                <Badge
                                    variant={contact.status === 'active' ? 'default' : 'secondary'}
                                    className="flex-shrink-0"
                                >
                                    {contact.status}
                                </Badge>
                            </div>

                            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                                {contact.email && (
                                    <a
                                        href={`mailto:${contact.email}`}
                                        className="flex items-center gap-1 hover:text-indigo-600"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Mail className="w-4 h-4" />
                                    </a>
                                )}
                                {contact.phone && (
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="flex items-center gap-1 hover:text-indigo-600"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Phone className="w-4 h-4" />
                                    </a>
                                )}
                                {contact.linkedinUrl && (
                                    <a
                                        href={contact.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-indigo-600"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Linkedin className="w-4 h-4" />
                                    </a>
                                )}
                            </div>

                            {contact.lastContactedAt && (
                                <p className="mt-3 text-xs text-gray-400">
                                    Last contacted: {new Date(contact.lastContactedAt).toLocaleDateString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {contacts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg">No contacts found</p>
                        <p className="text-sm mt-1">Add your first contact to get started</p>
                        <Button onClick={() => setShowCreateDialog(true)} className="mt-4 gap-2">
                            <Plus className="w-4 h-4" />
                            Add Contact
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Contact Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
                setShowCreateDialog(open);
                if (!open) resetCreateForm();
            }}>
                <DialogContent className="bg-white shadow-lg max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">Create New Contact</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Add a new contact to your CRM
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name *</Label>
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    value={newFirstName}
                                    onChange={(e) => setNewFirstName(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    value={newLastName}
                                    onChange={(e) => setNewLastName(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="CEO"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department</Label>
                                <Input
                                    id="department"
                                    placeholder="Sales"
                                    value={newDepartment}
                                    onChange={(e) => setNewDepartment(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Source</Label>
                            <Select value={newSource} onValueChange={(v) => setNewSource(v as typeof newSource)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="manual">Manual Entry</SelectItem>
                                    <SelectItem value="import">Import</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="referral">Referral</SelectItem>
                                    <SelectItem value="website">Website</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="hover:bg-gray-50 w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createContactMutation.mutate()}
                            disabled={!newFirstName || !newLastName || createContactMutation.isPending}
                            className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto"
                        >
                            {createContactMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            Create Contact
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Contact Detail Dialog */}
            <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedContact && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                        {selectedContact.avatarUrl ? (
                                            <img
                                                src={selectedContact.avatarUrl}
                                                alt={selectedContact.firstName}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-indigo-600" />
                                        )}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl">
                                            {selectedContact.firstName} {selectedContact.lastName}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {selectedContact.title}
                                            {selectedContact.company && ` at ${selectedContact.company.name}`}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Contact Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500">Email</label>
                                        <p className="font-medium">{selectedContact.email || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Phone</label>
                                        <p className="font-medium">{selectedContact.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Department</label>
                                        <p className="font-medium">{selectedContact.department || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Source</label>
                                        <p className="font-medium capitalize">{selectedContact.source}</p>
                                    </div>
                                </div>

                                {selectedContact.notes && (
                                    <div>
                                        <label className="text-sm text-gray-500">Notes</label>
                                        <p className="text-sm mt-1 bg-gray-50 p-3 rounded-lg">{selectedContact.notes}</p>
                                    </div>
                                )}

                                {/* AI Insights */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            AI Insights
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => generateInsightsMutation.mutate(selectedContact.id)}
                                            disabled={generateInsightsMutation.isPending}
                                        >
                                            {generateInsightsMutation.isPending ? 'Generating...' : 'Generate Insights'}
                                        </Button>
                                    </div>

                                    {selectedContact.aiInsights ? (
                                        <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                                            <p className="text-sm text-gray-700">{selectedContact.aiInsights.summary}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">Engagement:</span>
                                                <Badge
                                                    variant={
                                                        selectedContact.aiInsights.engagementLevel === 'high'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {selectedContact.aiInsights.engagementLevel}
                                                </Badge>
                                            </div>
                                            {selectedContact.aiInsights.suggestedActions?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                                        Suggested Actions:
                                                    </p>
                                                    <ul className="text-sm text-gray-700 space-y-1">
                                                        {selectedContact.aiInsights.suggestedActions.map(
                                                            (action: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2">
                                                                    <span className="text-indigo-600">•</span>
                                                                    {action}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                                            No AI insights yet. Click "Generate Insights" to analyze this contact.
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button variant="outline" className="gap-2">
                                        <Mail className="w-4 h-4" />
                                        Send Email
                                    </Button>
                                    <Button variant="outline" className="gap-2">
                                        <Phone className="w-4 h-4" />
                                        Log Call
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
