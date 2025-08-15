import { AccountBeforeCreateHook, AccountAfterCreateHook } from './types';

/**
 * Hooks triggered before account creation
 */
export const beforeAccountCreationHook = (async (account, context) => {
    // Add any logic needed before account creation
}) as AccountBeforeCreateHook;

/**
 * Hooks triggered after account creation
 */
export const afterAccountCreationHook = (async (account) => {
    // Add any logic needed after account creation
}) as AccountAfterCreateHook;