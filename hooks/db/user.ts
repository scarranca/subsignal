import { preferenceQueries } from '@/db/queries/preference';
import { DEFAULT_PREFERENCES } from '@/constants/preferences';
import { UserBeforeCreateHook, UserAfterCreateHook } from './types';

/**
 * Hooks triggered before user creation
 */
export const beforeUserCreationHook = (async (user, context) => {
    if (context && context.context) {
        context.context.isNewUser = true;
    }
}) as UserBeforeCreateHook;

/**
 * Hooks triggered after user creation
 * Creates default preferences for the new user
 */
export const afterUserCreationHook = (async (user) => {
    try {
        // Create default preferences for the new user
        await preferenceQueries.upsertUserPreference(user.id, DEFAULT_PREFERENCES);

        console.log(`Default preferences created for user: ${user.id}`);
    } catch (error) {
        console.warn('Error creating default preferences in afterUserCreationHook:', error);
    }
}) as UserAfterCreateHook;
