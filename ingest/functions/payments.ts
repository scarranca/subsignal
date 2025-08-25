import { emailService } from '@/services/email';
import { inngest } from '../client';

/**
 * Send a payment acknowledgement email to a user
 * @param event.data.userEmail - The email address of the user
 * @param event.data.status - The status of the subscription
 * @param event.data.currentPlan - The current plan of the subscription
 * @param event.data.subscriptionId - The ID of the subscription
 * @param event.data.subscriptionStartedAt - The date the subscription started
 * @param event.data.currentPeriodEnd - The date the current period ends
 */
export const sendPaymentAcknowledgement = inngest.createFunction(
    { id: 'send-payment-acknowledgement' },
    { event: 'app/send.acknowledgement.email' },
    async ({ event, step }) => {
        const {
            userEmail,
            status,
            currentPlan,
            subscriptionId,
            subscriptionStartedAt,
            currentPeriodEnd,
        } = event.data;

        await step.run(`send-acknowledgement-email-${subscriptionId}-${status}`, async () => {
            await emailService.sendAcknowledgementEmail(
                userEmail,
                status,
                currentPlan,
                subscriptionId,
                subscriptionStartedAt,
                currentPeriodEnd,
            );
        });

        return {
            message: `Send acknowledgement email to ${userEmail}`,
            userEmail,
            status,
            currentPlan,
            subscriptionId,
            subscriptionStartedAt,
            currentPeriodEnd,
        };
    },
);
