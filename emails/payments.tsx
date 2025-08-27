import {
    getAcknowledgementMessageLines,
    getAcknowledgementPreviewText,
    getAcknowledgementSubtitle,
    getAcknowledgementTitle,
    getCurrentPeriodEnd,
    getSubscriptionStartDate,
} from '@/constants/email';
import { BillingEntitlementStatus, BillingPlan } from '@/db/schema/billing';
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
} from '@react-email/components';

interface AcknowledgementEmailProps {
    status: BillingEntitlementStatus;
    currentPlan?: BillingPlan;
    subscriptionId?: string | null;
}

export const AcknowledgementEmail = ({
    status = 'active',
    currentPlan = 'solo_plan',
    subscriptionId,
}: AcknowledgementEmailProps) => {
    const emailPreviewText = getAcknowledgementPreviewText(status);
    const emailTitle = getAcknowledgementTitle(status);
    const emailSubtitle = getAcknowledgementSubtitle(status);
    const emailMessageLines = getAcknowledgementMessageLines(status, currentPlan);

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

                    <Section style={detailsSection}>
                        <Text style={detailsTitle}>Subscription Details</Text>
                        <table style={table}>
                            <tbody>
                                <tr>
                                    <td style={cellLabel}>Plan</td>
                                    <td style={cellValue}>{currentPlan || '—'}</td>
                                </tr>
                                <tr>
                                    <td style={cellLabel}>Status</td>
                                    <td style={cellValue}>{status}</td>
                                </tr>
                                <tr>
                                    <td style={cellLabel}>Subscription ID</td>
                                    <td style={cellValue}>{subscriptionId || '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </Section>

                    <Hr style={divider} />

                    <Section style={supportSection}>
                        <Text style={supportText}>Need help? We're here:</Text>
                        <Link href="mailto:support@subsignal.app" style={supportLink}>
                            support@subsignal.app
                        </Link>
                    </Section>

                    <Text style={footer}>Subsignal Labs • San Francisco</Text>
                </Container>
            </Body>
        </Html>
    );
};

// Styles (unchanged)
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
    textAlign: 'center',
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
    textAlign: 'center',
} as React.CSSProperties;

const subtitle = {
    fontSize: '16px',
    lineHeight: '1.4',
    fontWeight: '400',
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center',
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
    textAlign: 'center',
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
    textAlign: 'center',
} as React.CSSProperties;

export default AcknowledgementEmail;

// Preview Component with Test Data for All Statuses
// const PreviewAcknowledgementEmail = () => {
//     // Active subscription example
//     return (
//         <AcknowledgementEmail
//             status="active"
//             currentPlan="solo_plan"
//             subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//             subscriptionStartedAt={new Date('2024-01-15')}
//             currentPeriodEnd={new Date('2024-02-15')}
//         />
//     );

//     // Failed subscription example (failed activation)
//     return (
//         <AcknowledgementEmail
//             status="failed"
//             currentPlan="team_plan"
//             subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//             subscriptionStartedAt={new Date('2024-01-15')}
//             currentPeriodEnd={new Date('2024-02-15')}
//         />
//     );

//     // Renewed subscription example
//     return (
//         <AcknowledgementEmail
//             status="renewed"
//             currentPlan="enterprise_plan"
//             subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//             subscriptionStartedAt={new Date('2023-12-01')}
//             currentPeriodEnd={new Date('2024-02-28')}
//         />
//     );

//     // On hold example (failed renewal)
//     return (
//         <AcknowledgementEmail
//             status="on_hold"
//             currentPlan="solo_plan"
//             subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//             subscriptionStartedAt={new Date('2023-12-01')}
//             currentPeriodEnd={new Date('2024-01-28')}
//         />
//     );

//     // Cancelled subscription (will not renew)
//     return (
//         <AcknowledgementEmail
//             status="cancelled"
//             currentPlan="enterprise_plan"
//             subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//             subscriptionStartedAt={new Date('2023-06-15')}
//             currentPeriodEnd={new Date('2024-02-10')}
//         />
//     );

//     // Expired subscription
//     return (
//         <AcknowledgementEmail
//             status="expired"
//             currentPlan="team_plan"
//             subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//             subscriptionStartedAt={new Date('2023-08-20')}
//             currentPeriodEnd={new Date('2024-01-20')}
//         />
//     );
// };

// export default PreviewAcknowledgementEmail;
