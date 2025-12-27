'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Target,
    Users,
    Building2,
    TrendingUp,
    CheckSquare,
    Clock,
    AlertCircle,
    ArrowUpRight,
    Plus,
    DollarSign,
    Activity,
    Loader2,
} from 'lucide-react';
import { apiClient } from '@/client';
import { OrganizationOnboarding } from './OrganizationOnboarding';

interface DashboardStats {
    deals: {
        total: number;
        open: number;
        won: number;
        lost: number;
        totalValue: number;
        wonValue: number;
    };
    tasks: {
        total: number;
        pending: number;
        overdue: number;
        dueToday: number;
    };
    activities: {
        thisWeek: number;
        thisMonth: number;
    };
}

interface DashboardViewProps {
    onNavigate: (view: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
    // Check for organization
    const { data: orgData, isLoading: orgLoading } = useQuery({
        queryKey: ['current-organization'],
        queryFn: async () => {
            const res = await apiClient.get('/api/v1/organizations/current');
            if (!res.ok) return null;
            return res.json();
        },
    });

    // Fetch dashboard stats
    const { data: dealStats } = useQuery({
        queryKey: ['deals', 'stats'],
        queryFn: () => apiClient.get('/api/v1/deals/stats').then((res) => res.json()),
    });

    const { data: taskStats } = useQuery({
        queryKey: ['tasks', 'stats'],
        queryFn: () => apiClient.get('/api/v1/tasks/stats').then((res) => res.json()),
    });

    const { data: upcomingTasks } = useQuery({
        queryKey: ['tasks', 'upcoming'],
        queryFn: () => apiClient.get('/api/v1/tasks/upcoming?days=7').then((res) => res.json()),
    });

    const { data: overdueTasks } = useQuery({
        queryKey: ['tasks', 'overdue'],
        queryFn: () => apiClient.get('/api/v1/tasks/overdue').then((res) => res.json()),
    });

    const { data: recentActivities } = useQuery({
        queryKey: ['activities', 'recent'],
        queryFn: () => apiClient.get('/api/v1/activities/recent?limit=5').then((res) => res.json()),
    });

    const stats = {
        deals: dealStats || { total: 0, open: 0, won: 0, lost: 0, totalValue: 0, wonValue: 0 },
        tasks: taskStats || { total: 0, pending: 0, overdue: 0, dueToday: 0 },
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

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

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your CRM performance</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => onNavigate('deals')} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Deal
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('deals')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Pipeline</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(stats.deals.totalValue)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-green-600 font-medium">{stats.deals.open} open</span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-gray-600">{stats.deals.total} total</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('deals')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Won Deals</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(stats.deals.wonValue)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-green-600 font-medium">{stats.deals.won} won</span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-red-600">{stats.deals.lost} lost</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('tasks')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tasks Due Today</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.tasks.dueToday}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                <CheckSquare className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-amber-600 font-medium">{stats.tasks.pending} pending</span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-gray-600">{stats.tasks.total} total</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('tasks')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.tasks.overdue}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            {stats.tasks.overdue > 0 ? (
                                <Button variant="ghost" size="sm" className="text-red-600 -ml-2 hover:text-red-700">
                                    View overdue tasks
                                    <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                            ) : (
                                <span className="text-sm text-green-600 font-medium">All caught up!</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Tasks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate('tasks')}>
                            View all
                            <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {upcomingTasks?.data?.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingTasks.data.slice(0, 5).map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    task.priority === 'urgent'
                                                        ? 'bg-red-500'
                                                        : task.priority === 'high'
                                                          ? 'bg-orange-500'
                                                          : 'bg-gray-400'
                                                }`}
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                                {task.deal && (
                                                    <p className="text-xs text-gray-500">{task.deal.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            {task.dueDate
                                                ? new Date(task.dueDate).toLocaleDateString()
                                                : 'No due date'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No upcoming tasks</p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => onNavigate('tasks')}
                                >
                                    Create a task
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate('activities')}>
                            View all
                            <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentActivities?.data?.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivities.data.map((activity: any) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            {activity.entityType === 'deal' ? (
                                                <Target className="w-4 h-4 text-indigo-600" />
                                            ) : activity.entityType === 'contact' ? (
                                                <Users className="w-4 h-4 text-indigo-600" />
                                            ) : activity.entityType === 'company' ? (
                                                <Building2 className="w-4 h-4 text-indigo-600" />
                                            ) : (
                                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">
                                                {activity.description || `${activity.action} ${activity.entityType}`}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(activity.occurredAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No recent activity</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Overdue Tasks Alert */}
            {overdueTasks?.data?.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900">
                                    You have {overdueTasks.data.length} overdue task
                                    {overdueTasks.data.length > 1 ? 's' : ''}
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    Review and complete these tasks to stay on track with your deals.
                                </p>
                                <div className="mt-3 space-y-2">
                                    {overdueTasks.data.slice(0, 3).map((task: any) => (
                                        <div key={task.id} className="text-sm text-red-800">
                                            • {task.title}
                                            {task.deal && ` (${task.deal.name})`}
                                        </div>
                                    ))}
                                    {overdueTasks.data.length > 3 && (
                                        <p className="text-sm text-red-700">
                                            and {overdueTasks.data.length - 3} more...
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                                    onClick={() => onNavigate('tasks')}
                                >
                                    View all overdue tasks
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
