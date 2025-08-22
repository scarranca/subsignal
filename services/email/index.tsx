import { OutboundEmailService } from './outbound';
import { OnboardingEmail } from '@/emails/onboarding';

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

    async sendOnboardingEmail(recipients: string[] | string) {
        await this.outboundEmailService.sendEmail(
            recipients,
            "Subsignal - Welcome Aboard! Let's Get You Started",
            <OnboardingEmail />,
        );
    }
}

export const emailService = EmailService.getInstance();
