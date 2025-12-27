import { Context, Next } from 'hono';
import { validateApiKey, logApiKeyUsage } from '@/app/api/handlers/apiKey';

/**
 * Middleware to authenticate requests using API key
 * API key should be provided in the Authorization header as:
 * Authorization: Bearer crm_live_xxxxx
 * or
 * X-API-Key: crm_live_xxxxx
 */
export function requireApiKey(requiredScopes: string[] = []) {
    return async (c: Context, next: Next) => {
        const startTime = Date.now();

        // Extract API key from headers
        const authHeader = c.req.header('Authorization');
        const apiKeyHeader = c.req.header('X-API-Key');

        let apiKey: string | undefined;

        if (authHeader?.startsWith('Bearer ')) {
            apiKey = authHeader.slice(7);
        } else if (apiKeyHeader) {
            apiKey = apiKeyHeader;
        }

        if (!apiKey) {
            return c.json(
                {
                    error: 'API key required',
                    message: 'Provide API key via Authorization: Bearer <key> or X-API-Key header',
                },
                401
            );
        }

        // Validate the API key
        const { valid, keyRecord, error } = await validateApiKey(apiKey, requiredScopes);

        if (!valid || !keyRecord) {
            // Log failed attempt
            if (keyRecord) {
                await logApiKeyUsage(keyRecord.id, keyRecord.userId, {
                    method: c.req.method,
                    path: c.req.path,
                    statusCode: 401,
                    responseTime: Date.now() - startTime,
                    ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
                    userAgent: c.req.header('User-Agent'),
                    errorMessage: error,
                });
            }

            return c.json({ error: error || 'Invalid API key' }, 401);
        }

        // Check IP restrictions
        if (keyRecord.allowedIps && keyRecord.allowedIps.length > 0) {
            const clientIp = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
                || c.req.header('X-Real-IP');

            if (clientIp && !keyRecord.allowedIps.includes(clientIp)) {
                await logApiKeyUsage(keyRecord.id, keyRecord.userId, {
                    method: c.req.method,
                    path: c.req.path,
                    statusCode: 403,
                    responseTime: Date.now() - startTime,
                    ipAddress: clientIp,
                    userAgent: c.req.header('User-Agent'),
                    errorMessage: 'IP not allowed',
                });

                return c.json({ error: 'IP address not allowed' }, 403);
            }
        }

        // Set context variables
        c.set('apiKeyId', keyRecord.id);
        c.set('userId', keyRecord.userId);
        c.set('apiKeyScopes', keyRecord.scopes);

        // Continue with request
        await next();

        // Log successful request
        await logApiKeyUsage(keyRecord.id, keyRecord.userId, {
            method: c.req.method,
            path: c.req.path,
            statusCode: c.res.status,
            responseTime: Date.now() - startTime,
            ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
            userAgent: c.req.header('User-Agent'),
        });
    };
}

/**
 * Check if the API key has write permission for a resource
 */
export function hasWritePermission(c: Context, resource: string): boolean {
    const scopes = c.get('apiKeyScopes') as string[] || [];

    return scopes.includes('all:write')
        || scopes.includes(`${resource}:write`);
}

/**
 * Check if the API key has read permission for a resource
 */
export function hasReadPermission(c: Context, resource: string): boolean {
    const scopes = c.get('apiKeyScopes') as string[] || [];

    return scopes.includes('all:read')
        || scopes.includes('all:write')
        || scopes.includes(`${resource}:read`)
        || scopes.includes(`${resource}:write`);
}
