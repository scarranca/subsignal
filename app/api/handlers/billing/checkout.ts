import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import { getDodoProductIdFromPlanId } from '@/constants/pricing';
import { billingQueries } from '@/db/queries/billing';
import { dodopayments } from '@/payments/dodo';
import { Context } from 'hono';

export const getUser = (c: Context) => {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle POST request to create checkout session
 */
export async function handleCreateNewSubscription(c: Context) {
    try {
        const user = getUser(c);
        const { planId } = await c.req.json();

        const productId = getDodoProductIdFromPlanId(planId);
        if (!productId) {
            return c.json({ error: 'Invalid plan selected' }, 400);
        }

        // Create checkout session with your DodoPay client
        const checkoutSessionResponse = await dodopayments.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer: {
                email: user.email,
                name: user.name,
            },
            return_url: `${process.env.BETTER_AUTH_URL}/get-started?step=5`,
        });

        const response = {
            checkoutUrl: checkoutSessionResponse.checkout_url,
            sessionId: checkoutSessionResponse.session_id,
        };

        return c.json(response);
    } catch (error) {
        console.error('[CHECKOUT SESSION] Error creating checkout session:', error);
        return c.json({ error: 'Failed to create checkout session' }, 500);
    }
}

export async function handleUpdateExistingSubscription(c: Context) {
    try {
        const user = getUser(c);
        const { planId } = await c.req.json();

        const productId = getDodoProductIdFromPlanId(planId);
        if (!productId) {
            return c.json({ error: 'Invalid plan selected' }, 400);
        }

        const billingRecord = await billingQueries.getActiveBillingRecordByUserId(user.id);
        if (!billingRecord) {
            return c.json({ error: 'No active billing record found' }, 400);
        }

        const subscriptionId = billingRecord.subscriptionId;
        if (!subscriptionId) {
            return c.json({ error: 'No active subscription found' }, 400);
        }

        await dodopayments.subscriptions.changePlan(subscriptionId, {
            product_id: productId,
            proration_billing_mode: 'prorated_immediately',
            quantity: 1,
        });

        return c.json({ subscriptionId: subscriptionId });
    } catch (error) {
        console.error('[CHECKOUT SESSION] Error updating existing subscription:', error);
        return c.json(
            { error: error instanceof Error ? error.message : 'Failed to update subscription' },
            500,
        );
    }
}
