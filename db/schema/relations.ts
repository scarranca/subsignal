import { relations } from 'drizzle-orm';
import { user } from './auth';
import { preference } from './preference';
import { company } from './company';
import { page } from './page';
import { snapshot } from './snapshot';

export const userRelations = relations(user, ({ one, many }) => ({
    preference: one(preference, {
        fields: [user.id],
        references: [preference.userId],
    }),
    companies: many(company),
}));

export const preferenceRelations = relations(preference, ({ one }) => ({
    user: one(user, {
        fields: [preference.userId],
        references: [user.id],
    }),
}));

export const companyRelations = relations(company, ({ one, many }) => ({
    user: one(user, {
        fields: [company.userId],
        references: [user.id],
    }),
    pages: many(page),
}));

export const pageRelations = relations(page, ({ one, many }) => ({
    company: one(company, {
        fields: [page.companyId],
        references: [company.id],
    }),
    snapshots: many(snapshot),
}));

export const snapshotRelations = relations(snapshot, ({ one }) => ({
    page: one(page, {
        fields: [snapshot.pageId],
        references: [page.id],
    }),
}));
