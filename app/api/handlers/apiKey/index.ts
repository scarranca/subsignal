import { Context } from 'hono';
import { db } from '@/db';
import { apiKey, apiKeyLog } from '@/db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { getUser } from '@/app/api/middleware/auth';

/**
 * Generate a secure API key
 */
function generateApiKey(): { key: string; hash: string; prefix: string } {
    // Generate 32 bytes of random data
    const randomBytes = crypto.randomBytes(32);
    const key = `crm_live_${randomBytes.toString('base64url')}`;
    const prefix = key.slice(0, 12);

    // Hash the key for storage
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return { key, hash, prefix };
}

/**
 * Hash an API key for comparison
 */
export function hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Get all API keys for current user
 */
export async function handleGetApiKeys(c: Context) {
    const userId = getUser(c).id;

    const keys = await db
        .select({
            id: apiKey.id,
            name: apiKey.name,
            description: apiKey.description,
            keyPrefix: apiKey.keyPrefix,
            scopes: apiKey.scopes,
            rateLimit: apiKey.rateLimit,
            isActive: apiKey.isActive,
            lastUsedAt: apiKey.lastUsedAt,
            usageCount: apiKey.usageCount,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
        })
        .from(apiKey)
        .where(eq(apiKey.userId, userId))
        .orderBy(desc(apiKey.createdAt));

    return c.json({ apiKeys: keys });
}

/**
 * Create new API key
 */
export async function handleCreateApiKey(c: Context) {
    const userId = getUser(c).id;
    const body = await c.req.json();

    if (!body.name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    // Validate scopes
    const validScopes = [
        'contacts:read', 'contacts:write',
        'companies:read', 'companies:write',
        'deals:read', 'deals:write',
        'interactions:read', 'interactions:write',
        'tasks:read', 'tasks:write',
        'all:read', 'all:write',
    ];

    const scopes = body.scopes || ['all:read'];
    const invalidScopes = scopes.filter((s: string) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
        return c.json({ error: `Invalid scopes: ${invalidScopes.join(', ')}` }, 400);
    }

    // Generate the API key
    const { key, hash, prefix } = generateApiKey();

    // Create the record
    const [created] = await db
        .insert(apiKey)
        .values({
            userId,
            name: body.name,
            description: body.description,
            keyHash: hash,
            keyPrefix: prefix,
            scopes,
            rateLimit: body.rateLimit || 1000,
            allowedIps: body.allowedIps,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        })
        .returning();

    // Return the full key (only shown once)
    return c.json({
        apiKey: {
            id: created.id,
            name: created.name,
            key, // Full key - only shown once!
            keyPrefix: prefix,
            scopes: created.scopes,
            rateLimit: created.rateLimit,
            createdAt: created.createdAt,
        },
        warning: 'Save this API key now. You will not be able to see it again.',
    });
}

/**
 * Update API key
 */
export async function handleUpdateApiKey(c: Context) {
    const userId = getUser(c).id;
    const keyId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
        .select()
        .from(apiKey)
        .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)));

    if (!existing) {
        return c.json({ error: 'API key not found' }, 404);
    }

    const updateData: Partial<typeof apiKey.$inferInsert> = {};

    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.scopes) updateData.scopes = body.scopes;
    if (body.rateLimit) updateData.rateLimit = body.rateLimit;
    if (body.allowedIps !== undefined) updateData.allowedIps = body.allowedIps;
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    if (body.expiresAt !== undefined) {
        updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    updateData.updatedAt = new Date();

    await db
        .update(apiKey)
        .set(updateData)
        .where(eq(apiKey.id, keyId));

    const [updated] = await db
        .select({
            id: apiKey.id,
            name: apiKey.name,
            description: apiKey.description,
            keyPrefix: apiKey.keyPrefix,
            scopes: apiKey.scopes,
            rateLimit: apiKey.rateLimit,
            isActive: apiKey.isActive,
            lastUsedAt: apiKey.lastUsedAt,
            expiresAt: apiKey.expiresAt,
            updatedAt: apiKey.updatedAt,
        })
        .from(apiKey)
        .where(eq(apiKey.id, keyId));

    return c.json({ apiKey: updated });
}

/**
 * Delete API key
 */
export async function handleDeleteApiKey(c: Context) {
    const userId = getUser(c).id;
    const keyId = c.req.param('id');

    const [existing] = await db
        .select()
        .from(apiKey)
        .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)));

    if (!existing) {
        return c.json({ error: 'API key not found' }, 404);
    }

    // Delete logs first
    await db.delete(apiKeyLog).where(eq(apiKeyLog.apiKeyId, keyId));

    // Delete key
    await db.delete(apiKey).where(eq(apiKey.id, keyId));

    return c.json({ success: true });
}

/**
 * Regenerate API key
 */
export async function handleRegenerateApiKey(c: Context) {
    const userId = getUser(c).id;
    const keyId = c.req.param('id');

    const [existing] = await db
        .select()
        .from(apiKey)
        .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)));

    if (!existing) {
        return c.json({ error: 'API key not found' }, 404);
    }

    // Generate new key
    const { key, hash, prefix } = generateApiKey();

    await db
        .update(apiKey)
        .set({
            keyHash: hash,
            keyPrefix: prefix,
            usageCount: 0,
            lastUsedAt: null,
            updatedAt: new Date(),
        })
        .where(eq(apiKey.id, keyId));

    return c.json({
        apiKey: {
            id: keyId,
            name: existing.name,
            key, // Full key - only shown once!
            keyPrefix: prefix,
        },
        warning: 'Save this API key now. You will not be able to see it again.',
    });
}

/**
 * Get API key usage stats
 */
export async function handleGetApiKeyStats(c: Context) {
    const userId = getUser(c).id;
    const keyId = c.req.param('id');

    const [existing] = await db
        .select()
        .from(apiKey)
        .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)));

    if (!existing) {
        return c.json({ error: 'API key not found' }, 404);
    }

    // Get usage logs from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentLogs = await db
        .select()
        .from(apiKeyLog)
        .where(
            and(
                eq(apiKeyLog.apiKeyId, keyId),
                gte(apiKeyLog.createdAt, oneDayAgo)
            )
        )
        .orderBy(desc(apiKeyLog.createdAt))
        .limit(100);

    // Calculate stats
    const totalRequests = recentLogs.length;
    const successfulRequests = recentLogs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
    const failedRequests = recentLogs.filter(l => l.statusCode >= 400).length;
    const avgResponseTime = recentLogs.length > 0
        ? Math.round(recentLogs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / recentLogs.length)
        : 0;

    // Group by path
    const pathStats: Record<string, number> = {};
    for (const log of recentLogs) {
        pathStats[log.path] = (pathStats[log.path] || 0) + 1;
    }

    return c.json({
        stats: {
            totalRequests,
            successfulRequests,
            failedRequests,
            avgResponseTime,
            pathStats,
        },
        recentLogs: recentLogs.slice(0, 20).map(l => ({
            method: l.method,
            path: l.path,
            statusCode: l.statusCode,
            responseTime: l.responseTime,
            createdAt: l.createdAt,
        })),
    });
}

/**
 * Validate API key and check rate limit
 * Returns the key record if valid, null otherwise
 */
export async function validateApiKey(
    key: string,
    requiredScopes: string[] = []
): Promise<{ valid: boolean; keyRecord?: typeof apiKey.$inferSelect; error?: string }> {
    const hash = hashApiKey(key);

    const [keyRecord] = await db
        .select()
        .from(apiKey)
        .where(eq(apiKey.keyHash, hash));

    if (!keyRecord) {
        return { valid: false, error: 'Invalid API key' };
    }

    if (!keyRecord.isActive) {
        return { valid: false, error: 'API key is disabled' };
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
        return { valid: false, error: 'API key has expired' };
    }

    // Check scopes
    const keyScopes = keyRecord.scopes as string[];
    const hasAllAccess = keyScopes.includes('all:read') || keyScopes.includes('all:write');

    if (!hasAllAccess && requiredScopes.length > 0) {
        const hasRequiredScopes = requiredScopes.every(scope => {
            // Check for exact match or write access (which implies read)
            if (keyScopes.includes(scope)) return true;
            if (scope.endsWith(':read')) {
                const writeScope = scope.replace(':read', ':write');
                return keyScopes.includes(writeScope);
            }
            return false;
        });

        if (!hasRequiredScopes) {
            return { valid: false, error: 'Insufficient permissions' };
        }
    }

    // Check rate limit
    const oneHourAgo = new Date(Date.now() - (keyRecord.rateLimitWindow || 3600) * 1000);

    const recentRequests = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeyLog)
        .where(
            and(
                eq(apiKeyLog.apiKeyId, keyRecord.id),
                gte(apiKeyLog.createdAt, oneHourAgo)
            )
        );

    const requestCount = Number(recentRequests[0]?.count || 0);

    if (requestCount >= keyRecord.rateLimit) {
        return { valid: false, error: 'Rate limit exceeded' };
    }

    // Update last used
    await db
        .update(apiKey)
        .set({
            lastUsedAt: new Date(),
            usageCount: keyRecord.usageCount + 1,
        })
        .where(eq(apiKey.id, keyRecord.id));

    return { valid: true, keyRecord };
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(
    keyId: string,
    userId: string,
    request: {
        method: string;
        path: string;
        statusCode: number;
        responseTime?: number;
        ipAddress?: string;
        userAgent?: string;
        errorMessage?: string;
    }
): Promise<void> {
    await db.insert(apiKeyLog).values({
        apiKeyId: keyId,
        userId,
        method: request.method,
        path: request.path,
        statusCode: request.statusCode,
        responseTime: request.responseTime,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        errorMessage: request.errorMessage,
    });
}
