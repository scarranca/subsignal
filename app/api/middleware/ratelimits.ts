// middleware/rateLimit.ts
import { Context, Next } from 'hono';

// Simple rate limit configuration (per minute)
export const RATE_LIMITS = {
    health: 300, // High - monitoring/health checks
    auth: 30, // Low - prevent brute force
    preferences: 60, // Medium - users don't change often
    companies: {
        get: 120, // Medium-high - listing/viewing
        post: 30, // Medium - creating companies
        patch: 60, // Medium - updating companies
        delete: 20, // Lower - destructive action
        batch: 10, // Low - resource intensive
    },
    pages: {
        get: 180, // High - most common operation
        post: 60, // Medium - creating pages
        patch: 90, // Medium-high - updating pages
        delete: 30, // Medium - bulk operations
    },
    payments: {
        get: 60, // Medium - checking status
        post: 15, // Low - creating subscriptions
        put: 15, // Low - updating subscriptions
        validate: 90, // Medium-high - validation checks
    },
};

// Skip rate limiting for webhooks
// const SKIP_RATE_LIMITING_PATHS = ['/webhooks', '/inngest'];

// In-memory store (use Redis in production)
// const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Get rate limit for specific endpoint
// function getRateLimitForEndpoint(path: string, method: string): number {
//     // Health endpoints
//     if (path.startsWith('/health')) {
//         return RATE_LIMITS.health;
//     }

//     // Auth endpoints
//     if (path.startsWith('/auth')) {
//         return RATE_LIMITS.auth;
//     }

//     // Preferences endpoints
//     if (path.startsWith('/preferences')) {
//         return RATE_LIMITS.preferences;
//     }

//     // Companies endpoints
//     if (path.startsWith('/companies')) {
//         if (path.includes('/batch')) {
//             return RATE_LIMITS.companies.batch;
//         }

//         switch (method.toLowerCase()) {
//             case 'get':
//                 return RATE_LIMITS.companies.get;
//             case 'post':
//                 return RATE_LIMITS.companies.post;
//             case 'patch':
//                 return RATE_LIMITS.companies.patch;
//             case 'delete':
//                 return RATE_LIMITS.companies.delete;
//             default:
//                 return RATE_LIMITS.companies.get;
//         }
//     }

//     // Pages endpoints
//     if (path.startsWith('/pages')) {
//         switch (method.toLowerCase()) {
//             case 'get':
//                 return RATE_LIMITS.pages.get;
//             case 'post':
//                 return RATE_LIMITS.pages.post;
//             case 'patch':
//                 return RATE_LIMITS.pages.patch;
//             case 'delete':
//                 return RATE_LIMITS.pages.delete;
//             default:
//                 return RATE_LIMITS.pages.get;
//         }
//     }

//     // Payments endpoints
//     if (path.startsWith('/payments')) {
//         if (path.includes('/validate')) {
//             return RATE_LIMITS.payments.validate;
//         }

//         switch (method.toLowerCase()) {
//             case 'get':
//                 return RATE_LIMITS.payments.get;
//             case 'post':
//                 return RATE_LIMITS.payments.post;
//             case 'put':
//                 return RATE_LIMITS.payments.put;
//             default:
//                 return RATE_LIMITS.payments.get;
//         }
//     }

//     // Default fallback - reasonable limit for unknown endpoints
//     return 60;
// }

// Generate rate limit key based on IP
// function generateRateLimitKey(ip: string, path: string): string {
//     const now = Date.now();
//     const windowStart = Math.floor(now / (60 * 1000)); // 1-minute windows
//     return `${ip}:${path}:${windowStart}`;
// }

// Clean up expired entries
// function cleanupExpiredEntries() {
//     const now = Date.now();
//     for (const [key, value] of rateLimitStore.entries()) {
//         if (now > value.resetTime) {
//             rateLimitStore.delete(key);
//         }
//     }
// }

// Get client IP address
// function getClientIdentifier(c: Context): string {
//     // Vercel sets x-forwarded-for with the real client IP
//     const forwarded = c.req.header('x-forwarded-for');
//     if (forwarded) {
//         // Only split if there are multiple IPs (contains comma)
//         return forwarded.includes(',') ? forwarded.split(',')[0].trim() : forwarded.trim();
//     }

//     // Fallbacks for other environments
//     return (
//         c.req.header('x-real-ip') ||
//         c.req.header('cf-connecting-ip') || // Cloudflare
//         c.req.header('x-client-ip') ||
//         'unknown'
//     );
// }

// Main rate limit middleware
export async function rateLimit(_c: Context, next: Next) {
    await next(); // Temporarily disabled - proceed without rate limiting
    return;
    // try {
    //     // TODO: Replace with Redis-based rate limiting for production
    //     // Current in-memory implementation causes memory leaks and doesn't work with multiple server instances
    //     // Recommended: Use Redis with sliding window or token bucket algorithm
    //     // Skip rate limiting for webhooks
    //     const path = c.req.path;
    //     if (SKIP_RATE_LIMITING_PATHS.some((skipPath) => path.includes(skipPath))) {
    //         await next();
    //         return;
    //     }
    //     // Temporarily disabled - proceed without rate limiting
    //     await next();
    //     /* COMMENTED OUT - IN-MEMORY RATE LIMITING (CAUSES MEMORY LEAKS)
    //     const method = c.req.method;
    //     // Get client IP
    //     const ip = getClientIdentifier(c);
    //     // Get rate limit for this endpoint
    //     const limit = getRateLimitForEndpoint(path, method);
    //     // Generate key and check rate limit
    //     const key = generateRateLimitKey(ip, path);
    //     const now = Date.now();
    //     const windowStart = Math.floor(now / (60 * 1000)) * 60 * 1000;
    //     const resetTime = windowStart + 60 * 1000;
    //     // Clean up expired entries periodically
    //     if (Math.random() < 0.01) {
    //         // 1% chance
    //         cleanupExpiredEntries();
    //     }
    //     // Get or create rate limit entry
    //     let entry = rateLimitStore.get(key);
    //     if (!entry || now > entry.resetTime) {
    //         entry = { count: 0, resetTime };
    //         rateLimitStore.set(key, entry);
    //     }
    //     // Check if rate limit exceeded
    //     if (entry.count >= limit) {
    //         // Set rate limit headers
    //         c.header('X-RateLimit-Limit', limit.toString());
    //         c.header('X-RateLimit-Remaining', '0');
    //         c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    //         return c.json(
    //             {
    //                 error: 'Rate limit exceeded',
    //                 message: `Too many requests. Limit: ${limit} requests per minute.`,
    //                 limit,
    //                 resetTime: entry.resetTime,
    //             },
    //             429,
    //         );
    //     }
    //     // Increment counter
    //     entry.count++;
    //     rateLimitStore.set(key, entry);
    //     // Set rate limit headers
    //     c.header('X-RateLimit-Limit', limit.toString());
    //     c.header('X-RateLimit-Remaining', Math.max(0, limit - entry.count).toString());
    //     c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    //     await next();
    //     */
    // } catch (error) {
    //     console.error('Rate limit middleware error:', error);
    //     // On error, allow the request to proceed
    //     await next();
    // }
}
