'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Target,
    Building2,
    User,
    Filter,
} from 'lucide-react';
import { apiClient } from '@/client';
import { toast } from 'sonner';

interface TasksViewProps {
    onNavigate?: (view: string, params?: any) => void;
}

export function TasksView({ onNavigate }: TasksViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('pending');
    const queryClient = useQueryClient();

    // Fetch tasks
    const { data: tasksData, isLoading } = useQuery({
        queryKey: ['tasks', { status: filter === 'all' ? undefined : filter, overdue: filter === 'overdue' }],
        queryFn: () => {
            const params = new URLSearchParams();
            if (filter === 'pending') params.set('status', 'pending');
            if (filter === 'completed') params.set('status', 'completed');
            if (filter === 'overdue') params.set('overdue', 'true');
            params.set('pageSize', '100');
            return apiClient.get(`/api/v1/tasks?${params.toString()}`).then((res) => res.json());
        },
    });

    // Complete task mutation
    const completeTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            const res = await apiClient.post(`/api/v1/tasks/${taskId}/complete`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task completed');
        },
        onError: () => {
            toast.error('Failed to complete task');
        },
    });

    const tasks = tasksData?.data || [];

    const priorityColors = {
        low: 'bg-gray-100 text-gray-700',
        medium: 'bg-blue-100 text-blue-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
    };

    const typeIcons = {
        call: Phone,
        email: Mail,
        meeting: Calendar,
        follow_up: Clock,
        proposal: FileText,
        research: Search,
        demo: Target,
        other: CheckCircle2,
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date() && filter !== 'completed';
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
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
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-500 mt-1">{tasksData?.pagination?.totalItems || 0} tasks</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'pending', label: 'Pending', icon: Clock },
                    { id: 'overdue', label: 'Overdue', icon: AlertCircle },
                    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
                    { id: 'all', label: 'All', icon: Filter },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <Button
                            key={tab.id}
                            variant={filter === tab.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(tab.id as any)}
                            className="gap-2"
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </Button>
                    );
                })}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
                {tasks
                    .filter((task: any) => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((task: any) => (
                        <Card
                            key={task.id}
                            className={`hover:shadow-md transition-shadow ${
                                task.status === 'completed' ? 'opacity-60' : ''
                            } ${task.dueDate && isOverdue(task.dueDate) ? 'border-red-200 bg-red-50/50' : ''}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        checked={task.status === 'completed'}
                                        onCheckedChange={() => {
                                            if (task.status !== 'completed') {
                                                completeTaskMutation.mutate(task.id);
                                            }
                                        }}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3
                                                    className={`font-medium ${
                                                        task.status === 'completed'
                                                            ? 'line-through text-gray-500'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {task.title}
                                                </h3>
                                                {task.description && (
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                                                    {task.priority}
                                                </Badge>
                                                <Badge variant="outline" className="capitalize">
                                                    {task.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                            {task.dueDate && (
                                                <div
                                                    className={`flex items-center gap-1 ${
                                                        isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''
                                                    }`}
                                                >
                                                    {isOverdue(task.dueDate) ? (
                                                        <AlertCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Calendar className="w-4 h-4" />
                                                    )}
                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                </div>
                                            )}
                                            {task.deal && (
                                                <div className="flex items-center gap-1">
                                                    <Target className="w-4 h-4" />
                                                    <span className="truncate max-w-32">{task.deal.name}</span>
                                                </div>
                                            )}
                                            {task.company && (
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    <span className="truncate max-w-32">{task.company.name}</span>
                                                </div>
                                            )}
                                            {task.contact && (
                                                <div className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    <span className="truncate max-w-32">
                                                        {task.contact.firstName} {task.contact.lastName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                {tasks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg">
                            {filter === 'overdue'
                                ? 'No overdue tasks!'
                                : filter === 'completed'
                                  ? 'No completed tasks yet'
                                  : 'No tasks found'}
                        </p>
                        {filter === 'pending' && (
                            <Button className="mt-4 gap-2">
                                <Plus className="w-4 h-4" />
                                Create your first task
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Add missing imports that might be needed
import { Phone, Mail, FileText } from 'lucide-react';
