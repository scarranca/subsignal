import { userQueries } from '@/db/queries';
import { inngest } from '../client';
import { NonRetriableError } from 'inngest';
import { emailService } from '@/services/email';

/**
 * Send the plan change acknowledgement email to the user
 * This is sent prior to the plan change event
 */
export const sendPlanChangeAcknowledgementEmail = inngest.createFunction(
    {
        id: 'plan-change-ack-email',
        throttle: {
            limit: 1,
            period: '1s',
        },
    },
    { event: 'billing/plan-change.ack' },
    async ({ event, step }) => {
        const { userId, newPlan, subscriptionId } = event.data;

        const userEmailRecord = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailRecord) {
            throw new NonRetriableError('User email not found');
        }

        await emailService.sendPlanChangeAcknowledgementEmail({
            email: userEmailRecord.email,
            newPlan,
            subscriptionId,
        });
    },
);

/**
 * Send the plan change confirmation email to the user
 * This is sent after the plan change event has been processed
 * Some gateways may take upto 72 hours to process the charge
 * hence we send this email after the event has been processed
 */
export const sendPlanChangeConfirmationEmail = inngest.createFunction(
    {
        id: 'plan-change-confirm-email',
        throttle: {
            limit: 1,
            period: '1s',
        },
    },
    { event: 'billing/plan-change.confirmed' },
    async ({ event, step }) => {
        const { userId, newPlan, subscriptionId } = event.data;

        const userEmailRecord = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailRecord) {
            throw new NonRetriableError('User email not found');
        }

        await emailService.sendPlanChangeConfirmationEmail({
            email: userEmailRecord.email,
            newPlan,
            subscriptionId,
        });
    },
);

/**
 * Send the plan renewal confirmation email to the user
 * This is sent after the plan has been renewed
 */
export const sendPlanRenewalConfirmationEmail = inngest.createFunction(
    {
        id: 'plan-renewal-confirm-email',
        throttle: {
            limit: 1,
            period: '1s',
        },
    },
    { event: 'billing/plan-renewal.confirmed' },
    async ({ event, step }) => {
        const { userId, currentPlan, subscriptionId } = event.data;

        const userEmailRecord = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailRecord) {
            throw new NonRetriableError('User email not found');
        }

        await emailService.sendPlanRenewalConfirmationEmail({
            email: userEmailRecord.email,
            currentPlan,
            subscriptionId,
        });
    },
);

/**
 * Send the plan deactivation confirmation email to the user
 * This is sent after the plan has been deactivated
 */
export const sendPlanDeactivationConfirmationEmail = inngest.createFunction(
    {
        id: 'plan-deactivation-confirm-email',
        throttle: {
            limit: 1,
            period: '1s',
        },
    },
    { event: 'billing/plan-deactivation.confirmed' },
    async ({ event, step }) => {
        const { userId, deactivatedPlan, subscriptionId } = event.data;

        const userEmailRecord = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailRecord) {
            throw new NonRetriableError('User email not found');
        }

        await emailService.sendPlanDeactivationConfirmationEmail({
            email: userEmailRecord.email,
            deactivatedPlan,
            subscriptionId,
        });
    },
);

/**
 * Send the plan reactivation trigger email to the user
 * This is sent when the plan is reactivated
 */
export const sendPlanReactivationTriggerEmail = inngest.createFunction(
    {
        id: 'plan-reactivation-trigger-email',
        throttle: {
            limit: 1,
            period: '1s',
        },
    },
    { event: 'billing/plan-reactivation.triggered' },
    async ({ event, step }) => {
        const { userId, onHoldPlan, subscriptionId } = event.data;

        const userEmailRecord = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailRecord) {
            throw new NonRetriableError('User email not found');
        }

        await emailService.sendPlanReactivationTriggerEmail({
            email: userEmailRecord.email,
            onHoldPlan,
            subscriptionId,
        });
    },
);

/**
 * Send the plan expired email to the user
 * This is sent when the plan expires
 */
export const sendPlanExpiredEmail = inngest.createFunction(
    {
        id: 'plan-expired-email',
        throttle: {
            limit: 1,
            period: '1s',
        },
    },
    { event: 'billing/plan-expiry.confirmed' },
    async ({ event, step }) => {
        const { userId, expiredPlan, subscriptionId } = event.data;

        const userEmailRecord = await userQueries.getUserEmailByUserId(userId);
        if (!userEmailRecord) {
            throw new NonRetriableError('User email not found');
        }

        await emailService.sendPlanExpiredEmail({
            email: userEmailRecord.email,
            expiredPlan,
            subscriptionId,
        });
    },
);
