import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetTasks,
    handleGetTask,
    handleGetUpcomingTasks,
    handleGetOverdueTasks,
    handleCreateTask,
    handleUpdateTask,
    handleCompleteTask,
    handleDeleteTask,
    handleGetTaskStats,
} from '@/app/api/handlers/task';
import { requireBilling } from '@/app/api/middleware/billing';

const tasks = new Hono();

// Apply auth middleware to all task routes
tasks.use('*', requireAuth);

// Apply billing middleware
tasks.use('*', requireBilling);

// GET /api/v1/tasks - List tasks with pagination and filters
tasks.get('/', handleGetTasks);

// GET /api/v1/tasks/stats - Get task statistics
tasks.get('/stats', handleGetTaskStats);

// GET /api/v1/tasks/upcoming - Get upcoming tasks
tasks.get('/upcoming', handleGetUpcomingTasks);

// GET /api/v1/tasks/overdue - Get overdue tasks
tasks.get('/overdue', handleGetOverdueTasks);

// GET /api/v1/tasks/:id - Get specific task
tasks.get('/:id', handleGetTask);

// POST /api/v1/tasks - Create new task
tasks.post('/', handleCreateTask);

// PATCH /api/v1/tasks/:id - Update task
tasks.patch('/:id', handleUpdateTask);

// POST /api/v1/tasks/:id/complete - Mark task as complete
tasks.post('/:id/complete', handleCompleteTask);

// DELETE /api/v1/tasks/:id - Soft delete task
tasks.delete('/:id', handleDeleteTask);

export default tasks;
