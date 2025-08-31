import { auth } from '@/lib/auth';
import { Context } from 'hono';
import { Next } from 'hono';
import { User } from '@/types/users';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';

/**
 * Get the session from the request headers
 * @param c - The context object
 * @returns The session object
 */
export async function getSession(c: { req: { raw: { headers: Headers } } }) {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });
    return session;
}

/**
 * Require authentication middleware
 * @param c - The context object
 * @param next - The next middleware function
 */
export async function requireAuth(c: Context, next: Next) {
    c.timing.start('auth-middleware', 'Authentication middleware processing');

    c.timing.start('auth-session-check', 'Validate user session');
    const session = await getSession(c);
    c.timing.end('auth-session-check');

    if (!session) {
        c.timing.end('auth-middleware');
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // Set user in context for handlers to access
    c.set(USER_MIDDLEWARE_CONTEXT_KEY, session.user as User);

    c.timing.end('auth-middleware');
    await next();
}

/**
 * Get the user from the context
 * @param c - The context object
 * @returns The user object
 */
export function getUser(c: Context) {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
}
