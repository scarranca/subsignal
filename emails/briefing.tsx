import React from 'react';
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

type Period = '7_day' | '15_day' | '1_month' | '3_month' | '6_month';

interface Change {
    text: string;
    urls?: string[];
}

interface ChangeData {
    summary?: string;
    changes?: Change[];
}

interface BriefingEmailProps {
    company?: string;
    period?: Period;
    generatedAt?: string;
    data?: Record<string, ChangeData>;
}

export const BriefingEmail = ({
    company = 'Company',
    period = '7_day',
    generatedAt = new Date().toISOString(),
    data = {},
}: BriefingEmailProps) => {
    const calculateDateRange = (period: Period, currentDate = new Date()) => {
        const toDate = new Date(currentDate);
        const fromDate = new Date(currentDate);

        switch (period) {
            case '7_day':
                fromDate.setDate(toDate.getDate() - 7);
                break;
            case '15_day':
                fromDate.setDate(toDate.getDate() - 15);
                break;
            case '1_month':
                fromDate.setMonth(toDate.getMonth() - 1);
                break;
            case '3_month':
                fromDate.setMonth(toDate.getMonth() - 3);
                break;
            case '6_month':
                fromDate.setMonth(toDate.getMonth() - 6);
                break;
        }

        return {
            fromDate: fromDate
                .toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                })
                .replace(/\//g, '/'),
            toDate: toDate
                .toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                })
                .replace(/\//g, '/'),
        };
    };

    const getPeriodLabel = (period: Period) => {
        switch (period) {
            case '7_day':
                return 'Weekly';
            case '15_day':
                return 'Bi-weekly';
            case '1_month':
                return 'Monthly';
            case '3_month':
                return 'Quarterly';
            case '6_month':
                return 'Semi-annual';
        }
    };

    const formatSectionTitle = (key: string) => {
        return key.toUpperCase();
    };

    const getUrlFragment = (url: string) => {
        try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/').filter((segment) => segment);
            return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : 'link';
        } catch {
            // Fallback for invalid URLs
            return 'link';
        }
    };

    const ChangeList = ({ title, data }: { title: string; data: ChangeData }) => (
        <Section style={changeSection}>
            <Text style={sectionTitle}>{title}</Text>

            {/* Summary with fallback */}
            <Text style={sectionSummary}>
                {data.summary || `Nothing notable in ${title.toLowerCase()} this period.`}
            </Text>

            {/* Changes list with fallback */}
            {data.changes && data.changes.length > 0 ? (
                <Section style={bulletList}>
                    {data.changes.map((change, index) => (
                        <Section key={index} style={bulletItem}>
                            <Text style={bulletText}>
                                • {change.text}
                                {change.urls && change.urls.length > 0 && (
                                    <>
                                        {change.urls.map((url, urlIndex) => (
                                            <React.Fragment key={urlIndex}>
                                                {' '}
                                                <Link href={url} style={learnMoreLink}>
                                                    ↗{getUrlFragment(url)}
                                                </Link>
                                            </React.Fragment>
                                        ))}
                                    </>
                                )}
                            </Text>
                        </Section>
                    ))}
                </Section>
            ) : (
                <Text>• All steady here</Text>
            )}

            <Hr style={divider} />
        </Section>
    );

    // Enhanced filtering and fallback logic
    const hasData = data && typeof data === 'object' && Object.keys(data).length > 0;

    const sectionsToRender = hasData
        ? Object.entries(data).filter(
              ([_, sectionData]) => sectionData && typeof sectionData === 'object',
          )
        : [];

    const hasAnyChanges = sectionsToRender.some(
        ([_, sectionData]) => sectionData.changes && sectionData.changes.length > 0,
    );

    const { fromDate, toDate } = calculateDateRange(period, new Date(generatedAt));
    const periodLabel = getPeriodLabel(period);

    const previewText = `${periodLabel} Roundup for ${company}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={logoText}>Subsignal</Text>

                    <Text style={title}>
                        {periodLabel} Roundup for {company}
                    </Text>

                    <Text style={dateContainer}>
                        {fromDate} → {toDate}
                    </Text>

                    {/* Render all sections (including empty ones) */}
                    {sectionsToRender.length > 0 ? (
                        sectionsToRender.map(([sectionKey, sectionData]) => (
                            <ChangeList
                                key={sectionKey}
                                title={formatSectionTitle(sectionKey)}
                                data={sectionData}
                            />
                        ))
                    ) : (
                        <Section style={emptyReportSection}>
                            <Text style={noDataTitle}>All's quiet on this front</Text>
                            <Text style={noDataText}>
                                Nothing noteworthy for now. We'll continue watching up close.
                            </Text>
                        </Section>
                    )}

                    {/* Additional summary for reports with all empty sections */}
                    {sectionsToRender.length > 0 && !hasAnyChanges && (
                        <Section style={summarySection}>
                            <Text style={summaryTitle}>Summary</Text>
                            <Text style={summaryText}>
                                {company} held steady across all monitored areas this period.
                            </Text>
                        </Section>
                    )}

                    <Text style={footer}>{new Date(generatedAt).toLocaleDateString()}</Text>
                    <Text style={footer}>Subsignal Labs . San Francisco</Text>
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
};

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
};

const logoText = {
    textAlign: 'center' as const,
    fontSize: '24px',
    color: '#000',
    marginBottom: '40px',
};

const title = {
    fontSize: '24px',
    lineHeight: '1.3',
    fontWeight: '700',
    color: '#000',
    marginBottom: '20px',
    textAlign: 'center' as const,
};

const dateContainer = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '40px',
    textAlign: 'center' as const,
};

const divider = {
    borderTop: '1px solid #eaeaea',
    marginTop: '24px',
    marginBottom: '24px',
};

const changeSection = {
    marginBottom: '24px',
};

const sectionTitle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '12px',
};

const sectionSummary = {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    marginBottom: '16px',
};

const bulletList = {
    paddingLeft: '0',
    margin: '12px 0',
};

const bulletItem = {
    marginBottom: '8px',
};

const bulletText = {
    fontSize: '14px',
    color: '#000',
    lineHeight: '1.4',
    paddingLeft: '16px',
    textIndent: '-16px',
    margin: '0',
};

const learnMoreLink = {
    fontSize: '13px',
    color: '#666',
    textDecoration: 'none',
    fontWeight: '400',
};

const footer = {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
    textAlign: 'center' as const,
};

const emptyStateText = {
    fontSize: '14px',
    color: '#888',
    lineHeight: '1.4',
    paddingLeft: '16px',
    textIndent: '-16px',
    margin: '4px 0',
};

const emptyReportSection = {
    textAlign: 'center' as const,
    padding: '40px 20px',
    margin: '20px 0',
};

const noDataTitle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px',
};

const noDataText = {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    margin: '0',
};

const summarySection = {
    padding: '20px 0',
    margin: '30px 0',
};

const summaryTitle = {
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '12px',
};

const summaryText = {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5',
    margin: '0',
};

export default BriefingEmail;

// Preview Component with Test Data
// const PreviewBriefingEmail = () => {
//     // Mixed data example - each change has its own URLs
//     const exampleData = {
//         pricing: {
//             summary:
//                 'Stripe introduced volume-based discounts for enterprise accounts, while competitors remained static on pricing.',
//             changes: [
//                 {
//                     text: 'Stripe launches enterprise volume discounts starting at $1M ARR',
//                     urls: ['https://stripe.com/pricing', 'https://stripe.com/enterprise'],
//                 },
//                 {
//                     text: 'New tiered pricing structure announced for payment processing',
//                     urls: ['https://stripe.com/pricing-guide'],
//                 },
//             ],
//         },

//         product: {
//             summary: 'Major feature releases detected across the competitive landscape.',
//             changes: [
//                 {
//                     text: 'Square introduced AI-powered fraud detection',
//                     urls: ['https://square.com/features/fraud-detection'],
//                 },
//                 {
//                     text: 'PayPal rolled out one-click checkout for mobile',
//                     urls: [
//                         'https://paypal.com/mobile',
//                         'https://developer.paypal.com/docs/checkout',
//                     ],
//                 },
//                 {
//                     text: 'Adyen expanded cryptocurrency payment support',
//                     urls: [], // Change with no URLs
//                 },
//             ],
//         },

//         // Empty section with custom summary
//         branding: {
//             summary: 'Brand positioning remained consistent across all monitored channels.',
//             changes: [],
//         },

//         // Completely empty section (will use fallback)
//         partnerships: {},

//         // Section with changes but no summary (will use fallback summary)
//         integration: {
//             changes: [
//                 {
//                     text: 'Shopify Partnership API v2 released',
//                     urls: ['https://shopify.dev/api', 'https://partners.shopify.com/api-v2'],
//                 },
//             ],
//         },
//     };

//     return <BriefingEmail company="Stripe" period="15_day" data={exampleData} />;
// };

// export default PreviewBriefingEmail;
