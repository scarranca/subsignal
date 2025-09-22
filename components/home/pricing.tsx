'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CAL_URL } from '@/constants/contact';
import { PlanFeature, PRICING_PLANS, type PricingPlan, Period } from '@/constants/pricing';

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

function PricingPlanCard({
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
            className={`flex flex-col ${
                isPopular
                    ? 'bg-black text-white shadow-xl'
                    : 'bg-white border border-zinc-200 shadow-sm'
            } rounded-xl p-8 relative`}
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
    const [billingPeriod, setBillingPeriod] = useState<Period>('/month');

    const handleCtaClick = (ctaText: string) => {
        if (ctaText === 'Start Tracking') {
            router.push('/get-started?step=1');
        } else if (ctaText === 'Contact Sales') {
            window.open(CAL_URL, '_blank');
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
                <div className="flex flex-col gap-8">
                    <p className="text-center text-base text-muted-foreground md:text-lg">
                        Pricing
                    </p>
                    <h2 className="mx-auto max-w-2xl text-center font-dm-sans font-medium text-2xl text-foreground leading-normal tracking-tight md:text-3xl lg:text-4xl">
                        Pricing that works for you
                    </h2>
                </div>
            </div>

            <BillingToggle period={billingPeriod} onPeriodChange={setBillingPeriod} />

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, index) => (
                    <PricingPlanCard
                        key={index}
                        {...plan}
                        onCtaClick={() => handleCtaClick(plan.ctaText)}
                    />
                ))}
            </div>
        </section>
    );
}
