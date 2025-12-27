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

// CRM Deal notification interfaces
interface DealNotificationData {
    email: string;
    userName: string;
    dealName: string;
    dealValue?: number | null;
    currency: string;
    contactName?: string;
    companyName?: string;
    eventType: 'created' | 'updated' | 'won' | 'lost';
}

interface DealStageChangeData {
    email: string;
    userName: string;
    dealName: string;
    dealValue?: number | null;
    currency: string;
    previousStage: string;
    newStage: string;
}

interface DealWonNotificationData {
    email: string;
    userName: string;
    dealName: string;
    dealValue?: number | null;
    currency: string;
    contactName?: string;
    companyName?: string;
}

interface DealLostNotificationData {
    email: string;
    userName: string;
    dealName: string;
    dealValue?: number | null;
    currency: string;
    lostReason?: string | null;
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

    // ============== CRM DEAL NOTIFICATIONS ==============

    /**
     * Format currency value for display
     */
    private formatCurrency(value: number | null | undefined, currency: string): string {
        if (value == null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    /**
     * Send a deal notification email
     */
    async sendDealNotification(data: DealNotificationData): Promise<void> {
        const valueFormatted = this.formatCurrency(data.dealValue, data.currency);
        const subject = `New Deal Created: ${data.dealName}`;

        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">New Deal Created</h2>
                <p>Hi ${data.userName},</p>
                <p>A new deal has been created in your CRM:</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${data.dealName}</h3>
                    <p style="margin: 5px 0; color: #666;">Value: <strong>${valueFormatted}</strong></p>
                    ${data.contactName ? `<p style="margin: 5px 0; color: #666;">Contact: ${data.contactName}</p>` : ''}
                    ${data.companyName ? `<p style="margin: 5px 0; color: #666;">Company: ${data.companyName}</p>` : ''}
                </div>
                <p style="color: #666; font-size: 14px;">
                    <a href="${process.env.BETTER_AUTH_URL}/deals" style="color: #4f46e5;">View in CRM</a>
                </p>
            </div>
        `;

        await this.outboundEmailService.sendHtmlEmail(data.email, subject, htmlContent);
    }

    /**
     * Send a deal stage change notification
     */
    async sendDealStageChangeNotification(data: DealStageChangeData): Promise<void> {
        const valueFormatted = this.formatCurrency(data.dealValue, data.currency);
        const subject = `Deal Stage Changed: ${data.dealName}`;

        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Deal Stage Changed</h2>
                <p>Hi ${data.userName},</p>
                <p>A deal has moved to a new stage:</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${data.dealName}</h3>
                    <p style="margin: 5px 0; color: #666;">Value: <strong>${valueFormatted}</strong></p>
                    <div style="display: flex; align-items: center; margin-top: 15px;">
                        <span style="padding: 5px 12px; background: #e5e5e5; border-radius: 4px;">${data.previousStage}</span>
                        <span style="margin: 0 10px;">→</span>
                        <span style="padding: 5px 12px; background: #4f46e5; color: white; border-radius: 4px;">${data.newStage}</span>
                    </div>
                </div>
                <p style="color: #666; font-size: 14px;">
                    <a href="${process.env.BETTER_AUTH_URL}/deals" style="color: #4f46e5;">View in CRM</a>
                </p>
            </div>
        `;

        await this.outboundEmailService.sendHtmlEmail(data.email, subject, htmlContent);
    }

    /**
     * Send a deal won notification (celebratory!)
     */
    async sendDealWonNotification(data: DealWonNotificationData): Promise<void> {
        const valueFormatted = this.formatCurrency(data.dealValue, data.currency);
        const subject = `🎉 Deal Won: ${data.dealName}`;

        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 30px 0;">
                    <span style="font-size: 48px;">🎉</span>
                    <h2 style="color: #16a34a; margin: 10px 0;">Congratulations!</h2>
                </div>
                <p>Hi ${data.userName},</p>
                <p>Great news! You've won a deal:</p>
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                    <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${data.dealName}</h3>
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #16a34a;">${valueFormatted}</p>
                    ${data.contactName ? `<p style="margin: 5px 0; color: #666;">Contact: ${data.contactName}</p>` : ''}
                    ${data.companyName ? `<p style="margin: 5px 0; color: #666;">Company: ${data.companyName}</p>` : ''}
                </div>
                <p style="color: #666;">Keep up the great work!</p>
            </div>
        `;

        await this.outboundEmailService.sendHtmlEmail(data.email, subject, htmlContent);
    }

    /**
     * Send a deal lost notification
     */
    async sendDealLostNotification(data: DealLostNotificationData): Promise<void> {
        const valueFormatted = this.formatCurrency(data.dealValue, data.currency);
        const subject = `Deal Lost: ${data.dealName}`;

        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Deal Lost</h2>
                <p>Hi ${data.userName},</p>
                <p>Unfortunately, a deal has been marked as lost:</p>
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${data.dealName}</h3>
                    <p style="margin: 5px 0; color: #666;">Value: <strong>${valueFormatted}</strong></p>
                    ${data.lostReason ? `<p style="margin: 10px 0 0 0; color: #dc2626;">Reason: ${data.lostReason}</p>` : ''}
                </div>
                <p style="color: #666;">Every loss is a learning opportunity. Review this deal to identify areas for improvement.</p>
                <p style="color: #666; font-size: 14px;">
                    <a href="${process.env.BETTER_AUTH_URL}/deals" style="color: #4f46e5;">View in CRM</a>
                </p>
            </div>
        `;

        await this.outboundEmailService.sendHtmlEmail(data.email, subject, htmlContent);
    }

    // ============== TEAM MANAGEMENT NOTIFICATIONS ==============

    /**
     * Send a team invitation email
     */
    async sendTeamInvitation(data: {
        to: string;
        organizationName: string;
        inviterName: string;
        role: string;
        inviteToken: string;
    }): Promise<void> {
        const inviteUrl = `${process.env.BETTER_AUTH_URL}/invite/${data.inviteToken}`;
        const subject = `You're invited to join ${data.organizationName}`;

        const roleDisplay = data.role.charAt(0).toUpperCase() + data.role.slice(1);

        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">You've Been Invited!</h2>
                <p>${data.inviterName} has invited you to join <strong>${data.organizationName}</strong> on Subsignal.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0; color: #666;">Organization: <strong>${data.organizationName}</strong></p>
                    <p style="margin: 5px 0; color: #666;">Your role: <strong>${roleDisplay}</strong></p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                        Accept Invitation
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
                <p style="color: #999; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
        `;

        await this.outboundEmailService.sendHtmlEmail(data.to, subject, htmlContent);
    }
}

export const emailService = EmailService.getInstance();
