import {
    getMessageLines,
    getPreviewText,
    getSubtitle,
    getTitle,
    getFormattedPlan,
    getActionButtonText,
    getActionButtonUrl,
    EmailScenario,
} from '@/constants/email';
import { BillingPlan } from '@/db/schema/billing';
import {
    Html,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Text,
    Link,
    Hr,
    Button,
} from '@react-email/components';

interface AcknowledgementEmailProps {
    scenario: EmailScenario;
    subscriptionId?: string | null;
    // Parameters from your Inngest functions
    newPlan?: BillingPlan; // plan-change events
    currentPlan?: BillingPlan; // plan-renewal, active/inactive
    deactivatedPlan?: BillingPlan; // plan-deactivation
    onHoldPlan?: BillingPlan; // plan-reactivation
    expiredPlan?: BillingPlan; // plan-expired
}

export const AcknowledgementEmail = ({
    scenario,
    subscriptionId,
    newPlan,
    currentPlan,
    deactivatedPlan,
    onHoldPlan,
    expiredPlan,
}: AcknowledgementEmailProps) => {
    const emailPreviewText = getPreviewText(scenario);
    const emailTitle = getTitle(scenario);
    const emailSubtitle = getSubtitle(scenario);
    const emailMessageLines = getMessageLines(scenario, {
        newPlan,
        currentPlan,
        deactivatedPlan,
        onHoldPlan,
        expiredPlan,
    });
    const actionButtonText = getActionButtonText(scenario);
    const actionButtonUrl = getActionButtonUrl(scenario);

    // Determine which plan to show in details
    const displayPlan = newPlan || currentPlan || deactivatedPlan || onHoldPlan || expiredPlan;

    // Determine status display text
    const getStatusDisplay = (): string => {
        switch (scenario) {
            case 'subscription_active':
                return 'Active';
            case 'subscription_inactive':
                return 'Inactive - Payment Required';
            case 'plan_change_ack':
                return 'Plan Change Pending';
            case 'plan_change_confirmed':
                return 'Active';
            case 'plan_renewal_confirmed':
                return 'Active - Recently Renewed';
            case 'plan_deactivation':
                return 'Deactivated';
            case 'plan_reactivation':
                return 'Active - Recently Reactivated';
            case 'plan_expired':
                return 'Expired';
            default:
                return 'Active';
        }
    };

    return (
        <Html>
            <Head />
            <Preview>{emailPreviewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={logoText}>Subsignal</Text>

                    <Text style={title}>{emailTitle}</Text>
                    {emailSubtitle && <Text style={subtitle}>{emailSubtitle}</Text>}

                    <Section style={messageSection}>
                        {emailMessageLines.map((line, index) => (
                            <Text key={index} style={messageText}>
                                {line}
                            </Text>
                        ))}
                    </Section>

                    {/* Action Button */}
                    {actionButtonText && actionButtonUrl && (
                        <Section style={buttonSection}>
                            <Button href={actionButtonUrl} style={button}>
                                {actionButtonText}
                            </Button>
                        </Section>
                    )}

                    <Section style={detailsSection}>
                        <Text style={detailsTitle}>Subscription Details</Text>
                        <table style={table}>
                            <tbody>
                                <tr>
                                    <td style={cellLabel}>Plan</td>
                                    <td style={cellValue}>{getFormattedPlan(displayPlan)}</td>
                                </tr>
                                <tr>
                                    <td style={cellLabel}>Status</td>
                                    <td style={cellValue}>{getStatusDisplay()}</td>
                                </tr>
                                {subscriptionId && (
                                    <tr>
                                        <td style={cellLabel}>Subscription ID</td>
                                        <td style={cellValue}>{subscriptionId}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Section>

                    <Hr style={divider} />

                    <Section style={supportSection}>
                        <Text style={supportText}>Need help? We're here:</Text>
                        <Link href="mailto:nick@subsignal.vc" style={supportLink}>
                            nick@subsignal.vc
                        </Link>
                    </Section>

                    <Text style={footer}>Subsignal Labs • San Francisco</Text>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as React.CSSProperties;

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
} as React.CSSProperties;

const logoText = {
    textAlign: 'center' as const,
    fontSize: '24px',
    color: '#000',
    marginBottom: '40px',
} as React.CSSProperties;

const title = {
    fontSize: '28px',
    lineHeight: '1.3',
    fontWeight: '600',
    color: '#000',
    marginBottom: '8px',
    textAlign: 'center' as const,
} as React.CSSProperties;

const subtitle = {
    fontSize: '16px',
    lineHeight: '1.4',
    fontWeight: '400',
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center' as const,
} as React.CSSProperties;

const messageSection = {
    marginBottom: '32px',
} as React.CSSProperties;

const messageText = {
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#333',
    marginBottom: '16px',
} as React.CSSProperties;

const buttonSection = {
    textAlign: 'center' as const,
    marginBottom: '32px',
} as React.CSSProperties;

const button = {
    backgroundColor: '#000',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
} as React.CSSProperties;

const detailsSection = {
    marginBottom: '32px',
} as React.CSSProperties;

const detailsTitle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#000',
    marginBottom: '12px',
} as React.CSSProperties;

const table = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    border: '1px solid #eaeaea',
    borderRadius: '8px',
};

const cellLabel = {
    fontSize: '14px',
    color: '#666',
    padding: '8px 12px',
    borderBottom: '1px solid #eaeaea',
    borderRight: '1px solid #eaeaea',
    width: '35%',
    backgroundColor: '#f9f9f9',
} as React.CSSProperties;

const cellValue = {
    fontSize: '14px',
    color: '#333',
    padding: '8px 12px',
    borderBottom: '1px solid #eaeaea',
} as React.CSSProperties;

const divider = {
    borderTop: '1px solid #eaeaea',
    marginTop: '24px',
    marginBottom: '24px',
} as React.CSSProperties;

const supportSection = {
    textAlign: 'center' as const,
    marginBottom: '32px',
} as React.CSSProperties;

const supportText = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
} as React.CSSProperties;

const supportLink = {
    color: '#000',
    textDecoration: 'none',
    fontWeight: '500',
} as React.CSSProperties;

const footer = {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center' as const,
} as React.CSSProperties;

export default AcknowledgementEmail;
