import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import health from '../routes/health';
import auth from '../routes/auth';
import preferences from '../routes/preference';
import companies from '../routes/company';
import pages from '../routes/page';
import payments from '../routes/payments';
import briefings from '../routes/briefing';
import { rateLimit } from '../middleware/ratelimits';
import { serverTiming } from '../middleware/timing';
import snapshots from '../routes/snapshot';

/**
 * Force Node.js runtime to support googleapis and other Node.js modules
 */
export const runtime = 'nodejs';

/**
 * The main app
 */
const app = new Hono().basePath('/api');

/**
 * Global middleware - order matters for performance visibility
 */
// Server timing must be first to capture everything
app.use('*', serverTiming);
app.use('*', logger());
app.use(
    '*',
    cors({
        origin: [
            // --- Local domains ---
            'http://localhost:3000',
            // --- Prod domains ---
            'https://subsignal.app',
            'https://www.subsignal.app',
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization'],
    }),
);

/**
 * Apply rate limiting after CORS but before routes
 */
app.use('*', rateLimit);

/**
 * Stable Routes (no versioning)
 */
app.route('/health', health);

/**
 * Stable Routes (requires no backwards compatibility)
 */
app.route('/auth', auth);

/**
 * API versioning
 */
const v1 = new Hono();

/**
 * Versioned Routes (requires backwards compatibility)
 */
v1.route('/preferences', preferences);
v1.route('/companies', companies);
v1.route('/pages', pages);
v1.route('/payments', payments);
v1.route('/briefings', briefings);
v1.route('/snapshots', snapshots);

app.route('/v1', v1);

/**
 * Error handling
 */
app.onError((err, c) => {
    console.error('API Error:', err);
    return c.json(
        {
            error: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            route: c.req.path,
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        },
        500,
    );
});

/**
 * 404 handler
 */
app.notFound((c) => {
    return c.json(
        {
            error: 'Not Found',
            timestamp: new Date().toISOString(),
            route: c.req.path,
            message: 'Route not found',
        },
        404,
    );
});

/**
 * Export the app
 */
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
