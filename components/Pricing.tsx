'use client';

import { CAL_URL } from '@/constants/contact';
import { useRouter } from 'next/navigation';

interface PricingFeature {
    text: string;
    included: boolean;
}

interface PricingPlan {
    name: string;
    price: string;
    period?: string;
    description: string;
    features: PricingFeature[];
    ctaText: string;
    isPopular?: boolean;
    isEnterprise?: boolean;
}

function PricingFeature({ text, included }: PricingFeature) {
    return (
        <li className="flex items-center gap-3 text-sm">
            <svg
                className={`w-5 h-5 ${included ? 'text-green-500' : 'text-gray-300'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                />
            </svg>
            {text}
        </li>
    );
}

function PricingPlan({
    name,
    price,
    period,
    description,
    features,
    ctaText,
    isPopular,
    onCtaClick,
}: PricingPlan & { onCtaClick: () => void }) {
    return (
        <div
            className={`flex flex-col ${isPopular ? 'bg-black text-white shadow-xl' : 'bg-white border border-zinc-200 shadow-sm'} rounded-xl p-8 relative`}
        >
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                </div>
            )}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">{name}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{price}</span>
                    {period && (
                        <span className={isPopular ? 'text-gray-400' : 'text-gray-500'}>
                            {period}
                        </span>
                    )}
                </div>
                <p className={`mt-4 text-sm ${isPopular ? 'text-gray-400' : 'text-gray-600'}`}>
                    {description}
                </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, index) => (
                    <PricingFeature key={index} {...feature} />
                ))}
            </ul>
            <button
                onClick={onCtaClick}
                className={`w-full ${
                    isPopular
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                } px-6 py-2.5 rounded-md font-medium transition-colors`}
            >
                {ctaText}
            </button>
        </div>
    );
}

export default function Pricing() {
    const router = useRouter();

    const handleCtaClick = (ctaText: string) => {
        if (ctaText === 'Start Tracking') {
            router.push('/get-started');
        } else if (ctaText === 'Contact Sales') {
            window.open(CAL_URL, '_blank');
        }
    };

    const plans: PricingPlan[] = [
        {
            name: 'Solo',
            price: '$99',
            period: '/month',
            description: 'For individual VCs tracking their deal flow',
            features: [
                { text: 'Track up to 10 companies', included: true },
                { text: 'Monitor up to 50 pages', included: true },
                { text: 'Refresh every 15 days', included: true },
                { text: 'Email integration', included: true },
                { text: 'CRM integration (Affinity, AngelList)', included: false },
            ],
            ctaText: 'Start Tracking',
        },
        {
            name: 'Team',
            price: '$299',
            period: '/month',
            description: 'For investment teams and small funds',
            features: [
                { text: 'Track up to 50 companies', included: true },
                { text: 'Monitor up to 100 pages', included: true },
                { text: 'Refresh every 7 days', included: true },
                { text: 'Email & Slack integrations', included: true },
                { text: 'CRM integrations (Affinity, AngelList)', included: true },
                { text: 'Up to 10 seats', included: true },
                { text: 'Dedicated success manager', included: true },
            ],
            ctaText: 'Contact Sales',
            isPopular: true,
        },
        {
            name: 'Fund',
            price: 'Custom',
            description: 'For large funds with extensive deal flow',
            features: [
                { text: 'Unlimited company tracking', included: true },
                { text: 'Unlimited page monitoring', included: true },
                { text: 'Unlimited seats', included: true },
                { text: 'Refresh every 3 days', included: true },
                { text: 'All integrations', included: true },
                { text: 'Enterprise compliance (SOC2, GDPR)', included: true },
                { text: 'Dedicated success manager', included: true },
            ],
            ctaText: 'Contact Sales',
            isEnterprise: true,
        },
    ];

    return (
        <section className="py-16 md:py-24 px-6 md:px-12 scroll-mt-20" id="pricing">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    Simple, transparent
                    <br />
                    <span className="text-gray-500">pricing for all</span>
                </h2>
                <p className="text-lg text-gray-600">
                    Keep your thesis current. Deliver more than just capital.
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, index) => (
                    <PricingPlan
                        key={index}
                        {...plan}
                        onCtaClick={() => handleCtaClick(plan.ctaText)}
                    />
                ))}
            </div>
        </section>
    );
}
