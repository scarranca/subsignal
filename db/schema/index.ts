// Auth
import { user, session, account, verification } from './auth';

// Core CRM entities
import { contact, contactStatusEnum, contactSourceEnum } from './contact';
import { company, companySizeEnum, companyTypeEnum } from './company';
import { deal, dealPriorityEnum, dealStatusEnum } from './deal';
import { pipeline, pipelineStage, defaultPipelineStages } from './pipeline';
import { interaction, interactionTypeEnum, interactionDirectionEnum, interactionOutcomeEnum } from './interaction';
import { task, taskPriorityEnum, taskStatusEnum, taskTypeEnum } from './task';
import { activity, activityEntityTypeEnum, activityActionEnum } from './activity';
import { tag, entityTag, tagEntityTypeEnum } from './tag';
import { customField, customFieldValue, customFieldEntityTypeEnum, customFieldTypeEnum } from './customField';

// Settings & billing
import { preference } from './preference';
import { billing } from './billing';

// Legacy: Website monitoring (optional premium feature)
import { page } from './page';
import { snapshot } from './snapshot';
import { briefing } from './briefing';

// Relations
import {
    userRelations,
    preferenceRelations,
    companyRelations,
    contactRelations,
    pipelineRelations,
    pipelineStageRelations,
    dealRelations,
    interactionRelations,
    taskRelations,
    activityRelations,
    tagRelations,
    entityTagRelations,
    customFieldRelations,
    customFieldValueRelations,
    pageRelations,
    snapshotRelations,
    briefingRelations,
    billingRelations,
} from './relations';

// Schema export
export const schema = {
    // Auth
    user,
    session,
    account,
    verification,

    // Core CRM entities
    contact,
    company,
    deal,
    pipeline,
    pipelineStage,
    interaction,
    task,
    activity,
    tag,
    entityTag,
    customField,
    customFieldValue,

    // Settings & billing
    preference,
    billing,

    // Legacy: Website monitoring
    page,
    snapshot,
    briefing,
};

// Relations export
export const relations = {
    userRelations,
    preferenceRelations,
    companyRelations,
    contactRelations,
    pipelineRelations,
    pipelineStageRelations,
    dealRelations,
    interactionRelations,
    taskRelations,
    activityRelations,
    tagRelations,
    entityTagRelations,
    customFieldRelations,
    customFieldValueRelations,
    pageRelations,
    snapshotRelations,
    briefingRelations,
    billingRelations,
};

// Re-export types and enums
export {
    // Auth
    user,
    session,
    account,
    verification,

    // Contact
    contact,
    contactStatusEnum,
    contactSourceEnum,

    // Company
    company,
    companySizeEnum,
    companyTypeEnum,

    // Deal
    deal,
    dealPriorityEnum,
    dealStatusEnum,

    // Pipeline
    pipeline,
    pipelineStage,
    defaultPipelineStages,

    // Interaction
    interaction,
    interactionTypeEnum,
    interactionDirectionEnum,
    interactionOutcomeEnum,

    // Task
    task,
    taskPriorityEnum,
    taskStatusEnum,
    taskTypeEnum,

    // Activity
    activity,
    activityEntityTypeEnum,
    activityActionEnum,

    // Tag
    tag,
    entityTag,
    tagEntityTypeEnum,

    // Custom fields
    customField,
    customFieldValue,
    customFieldEntityTypeEnum,
    customFieldTypeEnum,

    // Settings & billing
    preference,
    billing,

    // Legacy
    page,
    snapshot,
    briefing,
};

// Type exports
export type { ContactSelect, ContactInsert, ContactStatus, ContactSource } from './contact';
export type { CompanySelect, CompanyInsert, CompanySize, CompanyType } from './company';
export type { DealSelect, DealInsert, DealPriority, DealStatus } from './deal';
export type { PipelineSelect, PipelineInsert, PipelineStageSelect, PipelineStageInsert } from './pipeline';
export type { InteractionSelect, InteractionInsert, InteractionType, InteractionDirection, InteractionOutcome } from './interaction';
export type { TaskSelect, TaskInsert, TaskPriority, TaskStatus, TaskType } from './task';
export type { ActivitySelect, ActivityInsert, ActivityEntityType, ActivityAction } from './activity';
export type { TagSelect, TagInsert, EntityTagSelect, EntityTagInsert, TagEntityType } from './tag';
export type { CustomFieldSelect, CustomFieldInsert, CustomFieldValueSelect, CustomFieldValueInsert, CustomFieldEntityType, CustomFieldType } from './customField';
export type { BillingSelect, BillingInsert, BillingPlan, BillingEntitlementStatus, BillingEntitlement, BillingProvider, AvailableBillingPlan } from './billing';
