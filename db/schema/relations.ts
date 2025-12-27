import { relations } from 'drizzle-orm';
import { user } from './auth';
import { organization, organizationMember, organizationInvite, userOrganization } from './organization';
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
import { integration, emailSync, calendarSync } from './integration';
import { apiKey, apiKeyLog, webhook, webhookDelivery } from './apiKey';

// Organization relations
export const organizationRelations = relations(organization, ({ one, many }) => ({
    createdByUser: one(user, {
        fields: [organization.createdBy],
        references: [user.id],
    }),
    members: many(organizationMember),
    invites: many(organizationInvite),
    // CRM data
    companies: many(company),
    contacts: many(contact),
    deals: many(deal),
    pipelines: many(pipeline),
    interactions: many(interaction),
    tasks: many(task),
    activities: many(activity),
}));

// Organization member relations
export const organizationMemberRelations = relations(organizationMember, ({ one }) => ({
    organization: one(organization, {
        fields: [organizationMember.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [organizationMember.userId],
        references: [user.id],
    }),
    invitedByUser: one(user, {
        fields: [organizationMember.invitedBy],
        references: [user.id],
        relationName: 'invitedMembers',
    }),
}));

// Organization invite relations
export const organizationInviteRelations = relations(organizationInvite, ({ one }) => ({
    organization: one(organization, {
        fields: [organizationInvite.organizationId],
        references: [organization.id],
    }),
    invitedByUser: one(user, {
        fields: [organizationInvite.invitedBy],
        references: [user.id],
    }),
}));

// User organization relations (current org selection)
export const userOrganizationRelations = relations(userOrganization, ({ one }) => ({
    user: one(user, {
        fields: [userOrganization.userId],
        references: [user.id],
    }),
    currentOrganization: one(organization, {
        fields: [userOrganization.currentOrganizationId],
        references: [organization.id],
    }),
}));

// User relations
export const userRelations = relations(user, ({ one, many }) => ({
    preference: one(preference, {
        fields: [user.id],
        references: [preference.userId],
    }),
    // Organization membership
    organizationMemberships: many(organizationMember),
    currentOrganization: one(userOrganization, {
        fields: [user.id],
        references: [userOrganization.userId],
    }),
    // CRM entities (created by user)
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
    // Integrations
    integrations: many(integration),
    emailSyncs: many(emailSync),
    calendarSyncs: many(calendarSync),
    // API access
    apiKeys: many(apiKey),
    webhooks: many(webhook),
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
    organization: one(organization, {
        fields: [company.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [company.userId],
        references: [user.id],
    }),
    owner: one(user, {
        fields: [company.ownerId],
        references: [user.id],
        relationName: 'ownedCompanies',
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
    organization: one(organization, {
        fields: [contact.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [contact.userId],
        references: [user.id],
    }),
    owner: one(user, {
        fields: [contact.ownerId],
        references: [user.id],
        relationName: 'ownedContacts',
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
    organization: one(organization, {
        fields: [pipeline.organizationId],
        references: [organization.id],
    }),
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
    organization: one(organization, {
        fields: [deal.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [deal.userId],
        references: [user.id],
    }),
    owner: one(user, {
        fields: [deal.ownerId],
        references: [user.id],
        relationName: 'ownedDeals',
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
    organization: one(organization, {
        fields: [interaction.organizationId],
        references: [organization.id],
    }),
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
    organization: one(organization, {
        fields: [task.organizationId],
        references: [organization.id],
    }),
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
    organization: one(organization, {
        fields: [activity.organizationId],
        references: [organization.id],
    }),
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

// Integration relations
export const integrationRelations = relations(integration, ({ one, many }) => ({
    user: one(user, {
        fields: [integration.userId],
        references: [user.id],
    }),
    emailSyncs: many(emailSync),
    calendarSyncs: many(calendarSync),
}));

// Email sync relations
export const emailSyncRelations = relations(emailSync, ({ one }) => ({
    integration: one(integration, {
        fields: [emailSync.integrationId],
        references: [integration.id],
    }),
    user: one(user, {
        fields: [emailSync.userId],
        references: [user.id],
    }),
}));

// Calendar sync relations
export const calendarSyncRelations = relations(calendarSync, ({ one }) => ({
    integration: one(integration, {
        fields: [calendarSync.integrationId],
        references: [integration.id],
    }),
    user: one(user, {
        fields: [calendarSync.userId],
        references: [user.id],
    }),
}));

// API Key relations
export const apiKeyRelations = relations(apiKey, ({ one, many }) => ({
    user: one(user, {
        fields: [apiKey.userId],
        references: [user.id],
    }),
    logs: many(apiKeyLog),
}));

// API Key log relations
export const apiKeyLogRelations = relations(apiKeyLog, ({ one }) => ({
    apiKey: one(apiKey, {
        fields: [apiKeyLog.apiKeyId],
        references: [apiKey.id],
    }),
    user: one(user, {
        fields: [apiKeyLog.userId],
        references: [user.id],
    }),
}));

// Webhook relations
export const webhookRelations = relations(webhook, ({ one, many }) => ({
    user: one(user, {
        fields: [webhook.userId],
        references: [user.id],
    }),
    deliveries: many(webhookDelivery),
}));

// Webhook delivery relations
export const webhookDeliveryRelations = relations(webhookDelivery, ({ one }) => ({
    webhook: one(webhook, {
        fields: [webhookDelivery.webhookId],
        references: [webhook.id],
    }),
    user: one(user, {
        fields: [webhookDelivery.userId],
        references: [user.id],
    }),
}));
