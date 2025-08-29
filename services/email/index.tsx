import { OutboundEmailService } from './outbound';
import { OnboardingEmail } from '@/emails/onboarding';
import AcknowledgementEmail from '@/emails/payments';
import { BillingPlan } from '@/db/schema/billing';
import { getBriefingSubject, getEmailSubject, getOnboardingSubject } from '@/constants/email';

interface PlanChangeAckEmailData {
    email: string;
    newPlan: BillingPlan;
    subscriptionId?: string;
}

interface PlanChangeConfirmedEmailData {
    email: string;
    newPlan: BillingPlan;
    subscriptionId?: string;
}

interface PlanRenewalConfirmedEmailData {
    email: string;
    currentPlan: BillingPlan;
    subscriptionId?: string;
}

interface PlanDeactivationEmailData {
    email: string;
    deactivatedPlan: BillingPlan;
    subscriptionId?: string;
}

interface PlanReactivationEmailData {
    email: string;
    onHoldPlan: BillingPlan;
    subscriptionId?: string;
}

interface PlanExpiredEmailData {
    email: string;
    expiredPlan: BillingPlan;
    subscriptionId?: string;
}

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
        const subject = getOnboardingSubject();

        const emailComponent = <OnboardingEmail />;

        await this.outboundEmailService.sendEmail(recipients, subject, emailComponent);
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
     * Send a plan change acknowledgement email to a user
     * @param data - The data for the email
     */
    async sendPlanChangeAcknowledgementEmail(data: PlanChangeAckEmailData): Promise<void> {
        const subject = getEmailSubject('plan_change_ack');

        const emailComponent = AcknowledgementEmail({
            scenario: 'plan_change_ack',
            newPlan: data.newPlan,
            subscriptionId: data.subscriptionId,
        });

        await this.outboundEmailService.sendEmail(data.email, subject, emailComponent);
    }

    /**
     * Send a plan change confirmation email to a user
     * @param data - The data for the email
     */
    async sendPlanChangeConfirmationEmail(data: PlanChangeConfirmedEmailData): Promise<void> {
        const subject = getEmailSubject('plan_change_confirmed');

        const emailComponent = AcknowledgementEmail({
            scenario: 'plan_change_confirmed',
            newPlan: data.newPlan,
            subscriptionId: data.subscriptionId,
        });

        await this.outboundEmailService.sendEmail(data.email, subject, emailComponent);
    }

    /**
     * Send a plan renewal confirmation email to a user
     * @param data - The data for the email
     */
    async sendPlanRenewalConfirmationEmail(data: PlanRenewalConfirmedEmailData): Promise<void> {
        const subject = getEmailSubject('plan_renewal_confirmed');

        const emailComponent = AcknowledgementEmail({
            scenario: 'plan_renewal_confirmed',
            currentPlan: data.currentPlan,
            subscriptionId: data.subscriptionId,
        });

        await this.outboundEmailService.sendEmail(data.email, subject, emailComponent);
    }

    /**
     * Send a plan deactivation confirmation email to a user
     * @param data - The data for the email
     */
    async sendPlanDeactivationConfirmationEmail(data: PlanDeactivationEmailData): Promise<void> {
        const subject = getEmailSubject('plan_deactivation');

        const emailComponent = AcknowledgementEmail({
            scenario: 'plan_deactivation',
            deactivatedPlan: data.deactivatedPlan,
            subscriptionId: data.subscriptionId,
        });

        await this.outboundEmailService.sendEmail(data.email, subject, emailComponent);
    }

    /**
     * Send a plan reactivation trigger email to a user
     * @param data - The data for the email
     */
    async sendPlanReactivationTriggerEmail(data: PlanReactivationEmailData): Promise<void> {
        const subject = getEmailSubject('plan_reactivation');

        const emailComponent = AcknowledgementEmail({
            scenario: 'plan_reactivation',
            onHoldPlan: data.onHoldPlan,
            subscriptionId: data.subscriptionId,
        });

        await this.outboundEmailService.sendEmail(data.email, subject, emailComponent);
    }

    /**
     * Send a plan expired email to a user
     * @param data - The data for the email
     */
    async sendPlanExpiredEmail(data: PlanExpiredEmailData): Promise<void> {
        const subject = getEmailSubject('plan_expired');

        const emailComponent = AcknowledgementEmail({
            scenario: 'plan_expired',
            expiredPlan: data.expiredPlan,
            subscriptionId: data.subscriptionId,
        });

        await this.outboundEmailService.sendEmail(data.email, subject, emailComponent);
    }
}

export const emailService = EmailService.getInstance();
