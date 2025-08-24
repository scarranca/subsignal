import { NextRequest, NextResponse } from 'next/server';
import { dodopayments } from '@/payments/dodo';

export async function POST(req: NextRequest) {
    try {
        const { priceId, discountCode, successUrl, cancelUrl } = await req.json();

        // Create checkout session with Dodo Payments
        const checkoutSession = await dodopayments.create({
            plan: priceId,
            success_url: successUrl,
            cancel_url: cancelUrl,
            ...(discountCode && { discount_code: discountCode }),
        });

        return NextResponse.json({
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id,
        });
    } catch (error) {
        console.error('Checkout creation error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
