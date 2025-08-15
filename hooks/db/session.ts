import { SessionBeforeCreateHook, SessionAfterCreateHook } from './types';

/**
 * Hooks triggered before session creation
 */
export const beforeSessionCreationHook = (async (session, context) => {
    // Add any logic needed before session creation
}) as SessionBeforeCreateHook;

/**
 * Hooks triggered after session creation
 */
export const afterSessionCreationHook = (async (session) => {
    // Add any logic needed after session creation
}) as SessionAfterCreateHook;
