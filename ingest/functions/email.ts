import { inngest } from '../client';

export const sendOnboardingEmail = inngest.createFunction(
    { id: 'send-onboarding-email' },
    { event: 'app/send.onboarding.email' },
    async ({ event, step }) => {
        await step.sleep('wait-a-moment', '1s');
        // TBD: Send email to user
        return { message: `Send onboarding email!` };
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
