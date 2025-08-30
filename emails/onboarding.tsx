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

interface OnboardingEmailProps {
    // TBD: Make the link trackable to understand activation rate
    dashboardLink?: string;
}

/**
 * Onboarding email for new users
 * @param dashboardLink - The link to the dashboard.
 * @returns The onboarding email.
 */
export const OnboardingEmail = ({
    dashboardLink = 'https://subsignal.app/dashboard',
}: OnboardingEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Subsignal is officially yours. Let's get you started.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={logoText}>Subsignal</Text>

                    <Text style={title}>Your unfair advantage starts now</Text>
                    <Text style={subtitle}>Subsignal is live - and it's officially yours</Text>

                    <Section style={messageSection}>
                        <Text style={messageText}>
                            We're thrilled to have you on board! Your Subsignal briefings start
                            today — highlighting product launches, pricing updates, and strategic
                            moves from the companies and competitors that matter most to you.
                        </Text>
                        <Text style={messageText}>
                            Subsignal helps you stay informed without adding another tool to your
                            stack. Everything happens right here over email, on the schedule that
                            works best for you — weekly, bi-weekly, or whenever you prefer.
                        </Text>
                        <Text style={messageText}>
                            No apps. No logins. Just high-signal intel to help you deliver more than
                            capital.
                        </Text>
                    </Section>

                    <Section style={featuresSection}>
                        <Text style={sectionTitle}>WHAT'S INCLUDED</Text>
                        <Section style={bulletList}>
                            <Text style={bulletText}>
                                • Deal Intelligence - Monitor companies you don&apos;t want to miss.
                                Time your bets better
                            </Text>
                            <Text style={bulletText}>
                                • Market Intelligence - Get a leg up on key sectors. Keep your
                                thesis in check.
                            </Text>
                            <Text style={bulletText}>
                                • Competitive Intelligence - Monitor competitive threats to your
                                portfolio companies.
                            </Text>
                            <Text style={bulletText}>
                                • Relationship Intelligence - Stay connected through pivots and
                                false starts.
                            </Text>
                        </Section>
                    </Section>

                    <Section style={ctaSection}>
                        <Link href={dashboardLink} style={ctaButton}>
                            Add your first company
                        </Link>
                        {/* To be added back once cloudflare email routing is live */}
                        {/* <Text style={expiryText}>
                            Or, simply forward your deck to{' '}
                            <Link href="mailto:deals@subsignal.app" style={supportLink}>
                                deals@subsignal.app
                            </Link>{' '}
                            and we'll take it from there
                        </Text> */}
                    </Section>

                    <Hr style={divider} />

                    <Section style={supportSection}>
                        <Text style={supportText}>Need help? We've got your back:</Text>
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
    textAlign: 'center',
    fontSize: '24px',
    color: '#000',
    marginBottom: '40px',
} as React.CSSProperties;

const title = {
    fontSize: '32px',
    lineHeight: '1.3',
    fontWeight: '700',
    color: '#000',
    marginBottom: '12px',
    textAlign: 'center',
} as React.CSSProperties;

const subtitle = {
    fontSize: '18px',
    color: '#666',
    marginBottom: '32px',
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

const divider = {
    borderTop: '1px solid #eaeaea',
    marginTop: '24px',
    marginBottom: '24px',
} as React.CSSProperties;

const featuresSection = {
    marginBottom: '32px',
} as React.CSSProperties;

const sectionTitle = {
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '16px',
} as React.CSSProperties;

const bulletList = {
    marginBottom: '24px',
} as React.CSSProperties;

const bulletText = {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6',
    marginBottom: '8px',
} as React.CSSProperties;

const ctaSection = {
    textAlign: 'center',
    marginBottom: '32px',
} as React.CSSProperties;

const ctaButton = {
    backgroundColor: '#000',
    color: '#fff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    display: 'inline-block',
    marginBottom: '12px',
} as React.CSSProperties;

const expiryText = {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px',
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

export default OnboardingEmail;
