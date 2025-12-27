import { relations } from 'drizzle-orm';
import { user } from './auth';
import { preference } from './preference';
import { company } from './company';
import { page } from './page';
import { snapshot } from './snapshot';
import { briefing } from './briefing';
import { billing } from './billing';
import { contact } from './contact';
import { deal } from './deal';
import { pipeline, pipelineStage } from './pipeline';
import { interaction } from './interaction';
import { task } from './task';
import { activity } from './activity';
import { tag, entityTag } from './tag';
import { customField, customFieldValue } from './customField';

// User relations
export const userRelations = relations(user, ({ one, many }) => ({
    preference: one(preference, {
        fields: [user.id],
        references: [preference.userId],
    }),
    companies: many(company),
    contacts: many(contact),
    deals: many(deal),
    pipelines: many(pipeline),
    interactions: many(interaction),
    tasks: many(task),
    activities: many(activity),
    tags: many(tag),
    customFields: many(customField),
    billing: one(billing, {
        fields: [user.id],
        references: [billing.userId],
    }),
}));

// Preference relations
export const preferenceRelations = relations(preference, ({ one }) => ({
    user: one(user, {
        fields: [preference.userId],
        references: [user.id],
    }),
}));

// Company relations
export const companyRelations = relations(company, ({ one, many }) => ({
    user: one(user, {
        fields: [company.userId],
        references: [user.id],
    }),
    contacts: many(contact),
    deals: many(deal),
    interactions: many(interaction),
    tasks: many(task),
    // Legacy: Website monitoring
    pages: many(page),
    briefings: many(briefing),
}));

// Contact relations
export const contactRelations = relations(contact, ({ one, many }) => ({
    user: one(user, {
        fields: [contact.userId],
        references: [user.id],
    }),
    company: one(company, {
        fields: [contact.companyId],
        references: [company.id],
    }),
    deals: many(deal),
    interactions: many(interaction),
    tasks: many(task),
}));

// Pipeline relations
export const pipelineRelations = relations(pipeline, ({ one, many }) => ({
    user: one(user, {
        fields: [pipeline.userId],
        references: [user.id],
    }),
    stages: many(pipelineStage),
    deals: many(deal),
}));

// Pipeline stage relations
export const pipelineStageRelations = relations(pipelineStage, ({ one, many }) => ({
    pipeline: one(pipeline, {
        fields: [pipelineStage.pipelineId],
        references: [pipeline.id],
    }),
    deals: many(deal),
}));

// Deal relations
export const dealRelations = relations(deal, ({ one, many }) => ({
    user: one(user, {
        fields: [deal.userId],
        references: [user.id],
    }),
    company: one(company, {
        fields: [deal.companyId],
        references: [company.id],
    }),
    contact: one(contact, {
        fields: [deal.contactId],
        references: [contact.id],
    }),
    pipeline: one(pipeline, {
        fields: [deal.pipelineId],
        references: [pipeline.id],
    }),
    stage: one(pipelineStage, {
        fields: [deal.stageId],
        references: [pipelineStage.id],
    }),
    interactions: many(interaction),
    tasks: many(task),
}));

// Interaction relations
export const interactionRelations = relations(interaction, ({ one }) => ({
    user: one(user, {
        fields: [interaction.userId],
        references: [user.id],
    }),
    company: one(company, {
        fields: [interaction.companyId],
        references: [company.id],
    }),
    contact: one(contact, {
        fields: [interaction.contactId],
        references: [contact.id],
    }),
    deal: one(deal, {
        fields: [interaction.dealId],
        references: [deal.id],
    }),
}));

// Task relations
export const taskRelations = relations(task, ({ one }) => ({
    user: one(user, {
        fields: [task.userId],
        references: [user.id],
    }),
    assignedTo: one(user, {
        fields: [task.assignedToId],
        references: [user.id],
        relationName: 'assignedTasks',
    }),
    company: one(company, {
        fields: [task.companyId],
        references: [company.id],
    }),
    contact: one(contact, {
        fields: [task.contactId],
        references: [contact.id],
    }),
    deal: one(deal, {
        fields: [task.dealId],
        references: [deal.id],
    }),
}));

// Activity relations
export const activityRelations = relations(activity, ({ one }) => ({
    user: one(user, {
        fields: [activity.userId],
        references: [user.id],
    }),
}));

// Tag relations
export const tagRelations = relations(tag, ({ one, many }) => ({
    user: one(user, {
        fields: [tag.userId],
        references: [user.id],
    }),
    entityTags: many(entityTag),
}));

// Entity tag relations
export const entityTagRelations = relations(entityTag, ({ one }) => ({
    tag: one(tag, {
        fields: [entityTag.tagId],
        references: [tag.id],
    }),
}));

// Custom field relations
export const customFieldRelations = relations(customField, ({ one, many }) => ({
    user: one(user, {
        fields: [customField.userId],
        references: [user.id],
    }),
    values: many(customFieldValue),
}));

// Custom field value relations
export const customFieldValueRelations = relations(customFieldValue, ({ one }) => ({
    customField: one(customField, {
        fields: [customFieldValue.customFieldId],
        references: [customField.id],
    }),
}));

// Legacy: Page relations (website monitoring)
export const pageRelations = relations(page, ({ one, many }) => ({
    company: one(company, {
        fields: [page.companyId],
        references: [company.id],
    }),
    snapshots: many(snapshot),
}));

// Legacy: Snapshot relations
export const snapshotRelations = relations(snapshot, ({ one }) => ({
    page: one(page, {
        fields: [snapshot.pageId],
        references: [page.id],
    }),
}));

// Legacy: Briefing relations
export const briefingRelations = relations(briefing, ({ one }) => ({
    company: one(company, {
        fields: [briefing.companyId],
        references: [company.id],
    }),
}));

// Billing relations
export const billingRelations = relations(billing, ({ one }) => ({
    user: one(user, {
        fields: [billing.userId],
        references: [user.id],
    }),
}));
