import { inngest } from '../client';
import { emailService } from '@/services/email';

export const sendOnboardingEmail = inngest.createFunction(
    { id: 'send-onboarding-email' },
    { event: 'app/send.onboarding.email' },
    async ({ event, step }) => {
        const { userEmail, userId } = event.data;

        await step.run(`send-onboarding-email-${userId}`, async () => {
            await emailService.sendOnboardingEmail(userEmail);
        });

        return {
            message: `Send onboarding email to ${userEmail}`,
            userId,
            userEmail,
        };
    },
);

export const sendBriefingEmail = inngest.createFunction(
    { id: 'send-briefing-email' },
    { event: 'app/send.briefing.email' },
    async ({ event, step }) => {
        await step.sleep('wait-a-moment', '1s');
        // TBD: Send email to user
        return { message: `Send briefing email!` };
    },
);
