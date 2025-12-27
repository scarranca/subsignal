import { pgTable, text, timestamp, index, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const tagEntityTypeEnum = pgEnum('tag_entity_type', [
    'company',
    'contact',
    'deal',
    'interaction',
    'task',
]);

export const tag = pgTable(
    'tag',
    {
        id: text('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        color: text('color').default('#6B7280').notNull(),
        description: text('description'),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
        updatedAt: timestamp('updated_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('tag_user_idx').on(table.userId),
        uniqueIndex('tag_user_name_idx').on(table.userId, table.name),
    ],
);

export const entityTag = pgTable(
    'entity_tag',
    {
        id: text('id').primaryKey(),
        tagId: text('tag_id')
            .notNull()
            .references(() => tag.id, { onDelete: 'cascade' }),
        entityType: tagEntityTypeEnum('entity_type').notNull(),
        entityId: text('entity_id').notNull(),
        createdAt: timestamp('created_at')
            .$defaultFn(() => new Date())
            .notNull(),
    },
    (table) => [
        index('entity_tag_tag_idx').on(table.tagId),
        index('entity_tag_entity_idx').on(table.entityType, table.entityId),
        uniqueIndex('entity_tag_unique_idx').on(table.tagId, table.entityType, table.entityId),
    ],
);

export type TagSelect = typeof tag.$inferSelect;
export type TagInsert = typeof tag.$inferInsert;
export type EntityTagSelect = typeof entityTag.$inferSelect;
export type EntityTagInsert = typeof entityTag.$inferInsert;
export type TagEntityType = (typeof tagEntityTypeEnum.enumValues)[number];
