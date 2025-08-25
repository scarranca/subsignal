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
    status: 'active' | 'grace' | 'cancelled' | 'expired';
    currentPlan?: 'solo' | 'team' | 'enterprise' | null;
    subscriptionId?: string | null;
    subscriptionStartedAt?: Date | null;
    currentPeriodEnd?: Date | null;
}

export const AcknowledgementEmail = ({
    status,
    currentPlan,
    subscriptionId,
    subscriptionStartedAt,
    currentPeriodEnd,
}: AcknowledgementEmailProps) => {
    const formatDate = (date?: Date | null) =>
        date ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date) : '—';

    const getPreviewText = () => {
        switch (status) {
            case 'active':
                return 'You made our nights and weekends worth it';
            case 'grace':
                return "Your Spot's Still Warm. Let's Figure This Out Together.";
            case 'cancelled':
                return "Your Spot's Still Warm. Let's Figure This Out Together.";
            case 'expired':
                return "We're keeping your spot warm till you're ready";
            default:
                return 'Subscription Update';
        }
    };

    const getTitle = () => {
        switch (status) {
            case 'active':
                return 'Access Confirmed';
            case 'grace':
                return "Your Spot's Still Warm";
            case 'cancelled':
                return "Your Spot's Still Warm";
            case 'expired':
                return "We're Here When You're Ready";
            default:
                return 'Subscription Update';
        }
    };

    const getSubtitle = () => {
        switch (status) {
            case 'active':
                return 'No, this is not a boring activation email';
            case 'grace':
                return "Alright, let's get you back in";
            case 'cancelled':
                return "Let's Figure This Out Together";
            case 'expired':
                return "We're keeping your spot warm till you're ready";
            default:
                return '';
        }
    };

    const getMessageLines = () => {
        switch (status) {
            case 'active':
                return [
                    `We know activation emails are supposed to be boring, but we can't resist saying a heartfelt thanks.`,
                    `Your ${currentPlan || 'subscription'} plan has been activated, and we're grateful to have you with us.`,
                ];
            case 'grace':
                return [
                    `Looks like there was an issue with your payment, no worries, happens to the best of us.`,
                    `You still have access until ${formatDate(currentPeriodEnd)}. You could try updating your payment method, we'll make sure everything continues smoothly.`,
                ];
            case 'cancelled':
                return [
                    `Not going to lie — it's sad to see you go. Your subscription is cancelled, but you still have access until ${formatDate(currentPeriodEnd)}.`,
                    `Mind if we ask what held you back from staying? Hit reply with any feedback, and we'll try doing right by you — no strings attached.`,
                ];
            case 'expired':
                return [
                    `Your subscription expired on ${formatDate(currentPeriodEnd)}. We hope you had a good time!`,
                    `If you'd like to return, reactivating is quick, and we'd love to have you back. We're keeping your spot warm till you're ready.`,
                ];
            default:
                return [''];
        }
    };

    return (
        <Html>
            <Head />
            <Preview>{getPreviewText()}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={logoText}>Subsignal</Text>

                    <Text style={title}>{getTitle()}</Text>
                    {getSubtitle() && <Text style={subtitle}>{getSubtitle()}</Text>}

                    <Section style={messageSection}>
                        {getMessageLines().map((line, index) => (
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
                                <tr>
                                    <td style={cellLabel}>Started</td>
                                    <td style={cellValue}>{formatDate(subscriptionStartedAt)}</td>
                                </tr>
                                <tr>
                                    <td style={cellLabel}>Period End</td>
                                    <td style={cellValue}>{formatDate(currentPeriodEnd)}</td>
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

// Preview Component with Test Data
// const PreviewAcknowledgementEmail = () => {
//     // Active subscription example
//     return (
//         <AcknowledgementEmail
//             status="active"
//             currentPlan="solo"
//             subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//             subscriptionStartedAt={new Date('2024-01-15')}
//             currentPeriodEnd={new Date('2024-02-15')}
//         />
//     );

// Grace period example (payment failed but still active)
// return (
//     <AcknowledgementEmail
//         status="grace"
//         currentPlan="solo"
//         subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//         subscriptionStartedAt={new Date('2023-12-01')}
//         currentPeriodEnd={new Date('2024-01-28')}
//         cancelAtPeriodEnd={false}
//     />
// );

// Cancelled subscription (will not renew)
// return (
//     <AcknowledgementEmail
//         status="cancelled"
//         currentPlan="enterprise"
//         subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//         subscriptionStartedAt={new Date('2023-06-15')}
//         currentPeriodEnd={new Date('2024-02-10')}
//         cancelAtPeriodEnd={true}
//     />
// );

// Expired subscription
// return (
//     <AcknowledgementEmail
//         status="expired"
//         currentPlan="team"
//         subscriptionId="sub_1QK8xY2eZvKYlo2C3m8Zr9X4"
//         subscriptionStartedAt={new Date('2023-08-20')}
//         currentPeriodEnd={new Date('2024-01-20')}
//         cancelAtPeriodEnd={false}
//     />
// );

// Minimal data example (no subscription details)
// return (
//     <AcknowledgementEmail
//         status="active"
//         currentPlan={null}
//         subscriptionId={null}
//         subscriptionStartedAt={null}
//         currentPeriodEnd={null}
//         cancelAtPeriodEnd={false}
//     />
// );
// };

// export default PreviewAcknowledgementEmail;
