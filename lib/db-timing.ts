// Database timing wrapper for comprehensive query performance monitoring
import { Context } from 'hono';

// Wrap database operations with timing
export function withDbTiming<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Context,
    description?: string,
): Promise<T> {
    const startTime = performance.now();

    return operation()
        .then((result) => {
            const duration = performance.now() - startTime;

            if (context?.timing) {
                context.timing.addEntry(operationName, duration, description);
            }

            return result;
        })
        .catch((error) => {
            const duration = performance.now() - startTime;

            if (context?.timing) {
                context.timing.addEntry(
                    `${operationName}-error`,
                    duration,
                    `${description} (failed)`,
                );
            }

            throw error;
        });
}

// Database query timing decorator
export function timeDbQuery<T extends unknown[], R>(
    queryFn: (...args: T) => Promise<R>,
    queryName: string,
) {
    return function (this: unknown, context: Context | undefined, ...args: T): Promise<R> {
        const description = `Database query: ${queryName}`;
        return withDbTiming(
            () => queryFn.apply(this, args),
            `db-${queryName.toLowerCase().replace(/\s+/g, '-')}`,
            context,
            description,
        );
    };
}

// Batch timing for multiple operations
export async function timeDbBatch<T>(
    operations: Array<() => Promise<T>>,
    batchName: string,
    context?: Context,
): Promise<T[]> {
    const startTime = performance.now();

    try {
        const results = await Promise.all(operations.map((op) => op()));
        const duration = performance.now() - startTime;

        if (context?.timing) {
            context.timing.addEntry(
                `db-batch-${batchName}`,
                duration,
                `Batch database operations: ${operations.length} queries`,
            );
        }

        return results;
    } catch (error) {
        const duration = performance.now() - startTime;

        if (context?.timing) {
            context.timing.addEntry(
                `db-batch-${batchName}-error`,
                duration,
                `Batch database operations failed: ${operations.length} queries`,
            );
        }

        throw error;
    }
}
