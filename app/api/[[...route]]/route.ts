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

/**
 * Force Node.js runtime to support googleapis and other Node.js modules
 */
export const runtime = 'nodejs';

/**
 * The main app
 */
const app = new Hono().basePath('/api');

/**
 * Global middleware
 */
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
// Add these once we have the archive feature in UI
// v1.route('/snapshots', snapshots);
// v1.route('/reports', reports);

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
