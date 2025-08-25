import { OutboundEmailService } from './outbound';
import { OnboardingEmail } from '@/emails/onboarding';
import AcknowledgementEmail from '@/emails/payments';
import {
    getSubscriptionSubject,
    getBriefingSubject,
    getOnboardingSubject,
} from '@/constants/email-subjects';

/**
 * Email service
 * @description This service is responsible for sending emails to users.
 * @example
 * ```ts
 * const emailService = EmailService.getInstance();
 * await emailService.sendOnboardingEmail('test@example.com');
 * ```
 */
export class EmailService {
    private static instance: EmailService;
    private outboundEmailService: OutboundEmailService;

    private constructor() {
        this.outboundEmailService = new OutboundEmailService();
    }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Send an onboarding email to a user
     * @param recipients - The email address of the recipient
     */
    async sendOnboardingEmail(recipients: string[] | string) {
        await this.outboundEmailService.sendEmail(
            recipients,
            getOnboardingSubject(),
            <OnboardingEmail />,
        );
    }

    /**
     * Send a briefing email to a user
     * @param recipients - The email address of the recipient
     * @param briefing - The briefing to send
     */
    async sendBriefingEmail(
        recipients: string[] | string,
        companyName: string,
        briefingHtml: string,
    ) {
        const subject = getBriefingSubject(companyName);
        await this.outboundEmailService.sendHtmlEmail(recipients, subject, briefingHtml);
    }

    /**
     * Send a subscription email to a user
     * @param recipients - The email address of the recipient
     * @param subscription - The subscription to send
     */
    async sendAcknowledgementEmail(
        recipients: string[],
        status: 'active' | 'grace' | 'cancelled' | 'expired',
        currentPlan: 'solo' | 'team' | 'enterprise',
        subscriptionId: string,
        subscriptionStartedAt: Date,
        currentPeriodEnd: Date,
    ) {
        await this.outboundEmailService.sendEmail(
            recipients,
            getSubscriptionSubject(status),
            <AcknowledgementEmail
                status={status}
                currentPlan={currentPlan}
                subscriptionId={subscriptionId}
                subscriptionStartedAt={subscriptionStartedAt}
                currentPeriodEnd={currentPeriodEnd}
            />,
        );
    }
}

export const emailService = EmailService.getInstance();
