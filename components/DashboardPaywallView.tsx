'use client';

import { PaywallPricing } from './PaywallPricing';
import { PaymentStatus } from '@/types/api';

interface DashboardPaywallViewProps {
    paymentStatus: PaymentStatus | null;
}

export const DashboardPaywallView = ({ paymentStatus }: DashboardPaywallViewProps) => {
    return (
        <div className="flex items-center justify-center h-full p-6">
            <PaywallPricing
                title="Get started with Subsignal"
                description="Pick a plan that works best for you"
                userEmail={paymentStatus?.userEmail || ''}
                currentPaymentStatus={paymentStatus}
            />
        </div>
    );
};
