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

// CRM routes
import contacts from '../routes/contact';
import pipelines from '../routes/pipeline';
import deals from '../routes/deal';
import interactions from '../routes/interaction';
import tasks from '../routes/task';
import activities from '../routes/activity';
import ai from '../routes/ai';

// Integration routes
import integrations from '../routes/integration';
import apiKeys from '../routes/apiKey';
import webhooks from '../routes/webhook';
import publicApi from '../routes/public';

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
        allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
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

/**
 * CRM Routes
 */
v1.route('/contacts', contacts);
v1.route('/pipelines', pipelines);
v1.route('/deals', deals);
v1.route('/interactions', interactions);
v1.route('/tasks', tasks);
v1.route('/activities', activities);
v1.route('/ai', ai);

/**
 * Integration Routes
 */
v1.route('/integrations', integrations);
v1.route('/api-keys', apiKeys);
v1.route('/webhooks', webhooks);

app.route('/v1', v1);

/**
 * Public API (API Key authenticated)
 */
app.route('/public', publicApi);

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
