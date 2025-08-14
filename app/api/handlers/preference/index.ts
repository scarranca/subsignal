import { Context } from 'hono';
import { preferenceQueries } from '@/db/queries';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';
import { updatePreferenceSchema } from '@/schema/api';
import { z } from 'zod';

export const getUser = (c: Context) => {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to fetch user preference
 */
export async function handleGetPreference(c: Context) {
    try {
        const user = getUser(c);
        
        const preference = await preferenceQueries.getUserPreference(user.id);
        
        if (!preference) {
            return c.json({ error: 'Preference not found' }, 404);
        }
        
        return c.json(preference);
    } catch (error) {
        console.error('Error fetching preference:', error);
        return c.json({ error: 'Failed to fetch preference' }, 500);
    }
}

/**
 * Handle POST/PUT request to create or update user preference
 */
export async function handleUpsertPreference(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        
        const validatedData = updatePreferenceSchema.parse(body);
        
        await preferenceQueries.upsertUserPreference(user.id, validatedData);
        
        const updatedPreference = await preferenceQueries.getUserPreference(user.id);
        
        return c.json(updatedPreference);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error upserting preference:', error);
        return c.json({ error: 'Failed to update preference' }, 500);
    }
}

/**
 * Handle DELETE request to soft delete user preference
 */
export async function handleDeletePreference(c: Context) {
    try {
        const user = getUser(c);
        
        await preferenceQueries.softDeletePreference(user.id);
        
        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting preference:', error);
        return c.json({ error: 'Failed to delete preference' }, 500);
    }
}