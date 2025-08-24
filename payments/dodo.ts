// Mock DodoPayments implementation for development
class MockDodoPayments {
    async create(params: {
        plan: string;
        success_url: string;
        cancel_url: string;
        discount_code?: string;
    }) {
        // Mock delay to simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Return mock checkout session
        const baseUrl = 'https://checkout.dodo.dev/session';
        const mockSessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return {
            id: mockSessionId,
            url: `${baseUrl}/${mockSessionId}?plan=${params.plan}${params.discount_code ? `&discount=${params.discount_code}` : ''}&success_url=${encodeURIComponent(params.success_url)}&cancel_url=${encodeURIComponent(params.cancel_url)}`,
        };
    }
}

export const dodopayments = new MockDodoPayments();
