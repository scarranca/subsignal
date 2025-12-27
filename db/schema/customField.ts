import { pgTable, text, timestamp, boolean, integer, index, pgEnum, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const customFieldEntityTypeEnum = pgEnum('custom_field_entity_type', [
    'company',
    'contact',
    'deal',
]);

export const customFieldTypeEnum = pgEnum('custom_field_type', [
    'text',
    'number',
    'date',
    'datetime',
    'boolean',
    'select',
    'multiselect',
    'url',
    'email',
    'phone',
    'currency',
    'percent',
    'textarea',
]);

export const customField = pgTable(
    'custom_field',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),

        // Field definition
        entityType: customFieldEntityTypeEnum('entity_type').notNull(),
        name: text('name').notNull(),
        label: text('label').notNull(),
        fieldType: customFieldTypeEnum('field_type').notNull(),

        // Field configuration
        description: text('description'),
        placeholder: text('placeholder'),
        defaultValue: jsonb('default_value'),
        options: jsonb('options').$type<Array<{
            value: string;
            label: string;
            color?: string;
        }>>(),

        // Validation
        isRequired: boolean('is_required').default(false).notNull(),
        minValue: integer('min_value'),
        maxValue: integer('max_value'),
        pattern: text('pattern'), // Regex pattern for validation

        // Display
        position: integer('position').default(0).notNull(),
        isVisible: boolean('is_visible').default(true).notNull(),
        showInList: boolean('show_in_list').default(false).notNull(),
        showInCard: boolean('show_in_card').default(true).notNull(),

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
        index('custom_field_user_idx').on(table.userId),
        index('custom_field_entity_type_idx').on(table.userId, table.entityType),
        uniqueIndex('custom_field_user_entity_name_idx').on(table.userId, table.entityType, table.name),
    ],
);

export const customFieldValue = pgTable(
    'custom_field_value',
    {
        id: text('id').primaryKey(),
        customFieldId: text('custom_field_id')
            .notNull()
            .references(() => customField.id, { onDelete: 'cascade' }),
        entityId: text('entity_id').notNull(),
        value: jsonb('value'),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('custom_field_value_field_idx').on(table.customFieldId),
        index('custom_field_value_entity_idx').on(table.entityId),
        uniqueIndex('custom_field_value_unique_idx').on(table.customFieldId, table.entityId),
    ],
);

export type CustomFieldSelect = typeof customField.$inferSelect;
export type CustomFieldInsert = typeof customField.$inferInsert;
export type CustomFieldValueSelect = typeof customFieldValue.$inferSelect;
export type CustomFieldValueInsert = typeof customFieldValue.$inferInsert;
export type CustomFieldEntityType = (typeof customFieldEntityTypeEnum.enumValues)[number];
export type CustomFieldType = (typeof customFieldTypeEnum.enumValues)[number];
