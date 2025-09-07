'use client';

import { CAL_DISCOVERY_URL } from '@/constants/contact';
import { PlanFeature, PRICING_PLANS, type PricingPlan, Period } from '@/constants/pricing';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function BillingToggle({
    period,
    onPeriodChange,
}: {
    period: Period;
    onPeriodChange: (period: Period) => void;
}) {
    return (
        <div className="flex items-center justify-center mb-12">
            <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                    onClick={() => onPeriodChange('/month')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        period === '/month'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => onPeriodChange('/year')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        period === '/year'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Annual
                </button>
            </div>
        </div>
    );
}

function PricingFeature({ text, included }: PlanFeature) {
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
                {/* {period === '/year' ? (
                    <p className={`text-sm mt-1 ${isPopular ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${id === 'solo_plan_annually' ? '99' : '299'}/month if paid monthly
                    </p>
                ) : (
                    <p className={`text-sm mt-1 ${isPopular ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${id === 'solo_plan_monthly' ? '999' : '2499'}/year if paid annually
                    </p>
                )} */}
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
    const [billingPeriod, setBillingPeriod] = useState<Period>('/month');

    const handleCtaClick = (ctaText: string) => {
        if (ctaText === 'Start Tracking') {
            router.push('/get-started?step=1');
        } else if (ctaText === 'Contact Sales') {
            window.open(CAL_DISCOVERY_URL, '_blank');
        }
    };

    // Filter plans based on selected period and exclude enterprise
    const filteredPlans = PRICING_PLANS.filter(
        (plan) => plan.period === billingPeriod && !plan.isEnterprise,
    );

    // Always show enterprise plan
    const enterprisePlan = PRICING_PLANS.find((plan) => plan.isEnterprise);
    const plans = enterprisePlan ? [...filteredPlans, enterprisePlan] : filteredPlans;

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

            <BillingToggle period={billingPeriod} onPeriodChange={setBillingPeriod} />

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
