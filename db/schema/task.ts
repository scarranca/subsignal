import { pgTable, text, timestamp, boolean, index, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { organization } from './organization';
import { company } from './company';
import { contact } from './contact';
import { deal } from './deal';

export const taskPriorityEnum = pgEnum('task_priority', [
    'low',
    'medium',
    'high',
    'urgent',
]);

export const taskStatusEnum = pgEnum('task_status', [
    'pending',
    'in_progress',
    'completed',
    'cancelled',
]);

export const taskTypeEnum = pgEnum('task_type', [
    'call',
    'email',
    'meeting',
    'follow_up',
    'proposal',
    'research',
    'demo',
    'other',
]);

export const task = pgTable(
    'task',
    {
        id: text('id').primaryKey(),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organization.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        assignedToId: text('assigned_to_id').references(() => user.id, { onDelete: 'set null' }),
        companyId: text('company_id').references(() => company.id, { onDelete: 'set null' }),
        contactId: text('contact_id').references(() => contact.id, { onDelete: 'set null' }),
        dealId: text('deal_id').references(() => deal.id, { onDelete: 'set null' }),

        // Task details
        title: text('title').notNull(),
        description: text('description'),
        type: taskTypeEnum('type').default('other').notNull(),

        // Priority and status
        priority: taskPriorityEnum('priority').default('medium').notNull(),
        status: taskStatusEnum('status').default('pending').notNull(),

        // Timing
        dueDate: timestamp('due_date'),
        reminderAt: timestamp('reminder_at'),
        completedAt: timestamp('completed_at'),

        // Recurrence
        isRecurring: boolean('is_recurring').default(false).notNull(),
        recurringPattern: jsonb('recurring_pattern').$type<{
            frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
            interval: number;
            endDate?: string;
            daysOfWeek?: number[];
        }>(),

        // Additional data
        tags: text('tags').array(),
        metadata: jsonb('metadata').$type<Record<string, unknown>>(),

        // Metadata
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('task_org_idx').on(table.organizationId),
        index('task_assigned_to_idx').on(table.assignedToId),
        index('task_company_idx').on(table.companyId),
        index('task_contact_idx').on(table.contactId),
        index('task_deal_idx').on(table.dealId),
        index('task_org_status_idx').on(table.organizationId, table.status),
        index('task_org_due_date_idx').on(table.organizationId, table.dueDate),
        index('task_org_priority_status_idx').on(table.organizationId, table.priority, table.status),
    ],
);

export type TaskSelect = typeof task.$inferSelect;
export type TaskInsert = typeof task.$inferInsert;
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskType = (typeof taskTypeEnum.enumValues)[number];
