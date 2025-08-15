import { beforeUserCreationHook, afterUserCreationHook } from './user';
import { beforeAccountCreationHook, afterAccountCreationHook } from './account';
import { beforeSessionCreationHook, afterSessionCreationHook } from './session';

export const userHooks = {
    create: {
        before: beforeUserCreationHook,
        after: afterUserCreationHook,
    },
};

export const accountHooks = {
    create: {
        before: beforeAccountCreationHook,
        after: afterAccountCreationHook,
    },
};

export const sessionHooks = {
    create: {
        before: beforeSessionCreationHook,
        after: afterSessionCreationHook,
    },
};

export * from './types';