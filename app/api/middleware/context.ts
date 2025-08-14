import type { User } from '@/types/users';

/**
 * Extend Hono's context to include user and email data
 */
declare module 'hono' {
    interface ContextVariableMap {
        user: User | null;
    }
}
