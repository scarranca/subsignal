import { OutboundEmailService } from './outbound';
import { OnboardingEmail } from '@/emails/onboarding';

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
            "Subsignal - Welcome Aboard! Let's Get You Started",
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
        // Random one-word subject line variations - all ending with date
        const subjectVariations = [
            `Briefing for ${companyName}`,
            `Intel for ${companyName}`,
            `Update for ${companyName}`,
            `Brief for ${companyName}`,
            `Report for ${companyName}`,
            `Analysis for ${companyName}`,
            `Insights for ${companyName}`,
            `Overview for ${companyName}`,
            `Summary for ${companyName}`,
            `Digest for ${companyName}`,
        ];

        const randomSubject =
            subjectVariations[Math.floor(Math.random() * subjectVariations.length)];
        const dateString = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
        const subject = `${randomSubject} - ${dateString}`;

        await this.outboundEmailService.sendHtmlEmail(recipients, subject, briefingHtml);
    }
}

export const emailService = EmailService.getInstance();
