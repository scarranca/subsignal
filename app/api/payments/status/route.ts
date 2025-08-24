import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Mock delay to simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Mock payment status - you can change this to test different scenarios
        const mockPaymentStatus = {
            isPaying: false, // Set to false to test non-paying user
            currentPlan: 'team', // 'solo' or 'team' or null
            subscriptionId: 'sub_mock_12345',
            status: 'active', // 'active', 'canceled', 'past_due', etc.
        };

        return NextResponse.json(mockPaymentStatus);
    } catch (error) {
        console.error('Payment status check error:', error);
        return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
    }
}
