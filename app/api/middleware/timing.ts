import { Context, Next } from 'hono';

// Server Timing middleware for comprehensive performance monitoring
// Provides complete visibility into request lifecycle timing

interface TimingEntry {
    name: string;
    startTime: number;
    duration?: number;
    description?: string;
}

interface TimingContext {
    entries: Map<string, TimingEntry>;
    requestStart: number;
}

// Extend Hono context to include timing
declare module 'hono' {
    interface Context {
        timing: {
            start: (name: string, description?: string) => void;
            end: (name: string) => void;
            measure: (name: string, description?: string) => number;
            addEntry: (name: string, duration: number, description?: string) => void;
        };
    }
}

export async function serverTiming(c: Context, next: Next) {
    const timingContext: TimingContext = {
        entries: new Map(),
        requestStart: performance.now(),
    };

    // Add timing methods to context
    c.timing = {
        start: (name: string, description?: string) => {
            timingContext.entries.set(name, {
                name,
                startTime: performance.now(),
                description,
            });
        },

        end: (name: string) => {
            const entry = timingContext.entries.get(name);
            if (entry && !entry.duration) {
                entry.duration = performance.now() - entry.startTime;
            }
        },

        measure: (name: string, description?: string) => {
            const startTime = performance.now();
            timingContext.entries.set(name, {
                name,
                startTime,
                description,
            });
            return startTime;
        },

        addEntry: (name: string, duration: number, description?: string) => {
            timingContext.entries.set(name, {
                name,
                startTime: 0,
                duration,
                description,
            });
        },
    };

    // Start middleware timing
    c.timing.start('middleware', 'Total middleware processing time');

    try {
        // Measure request processing
        c.timing.start('request', 'Total request processing time');

        await next();

        c.timing.end('request');
        c.timing.end('middleware');

        // Add total request time
        const totalTime = performance.now() - timingContext.requestStart;
        c.timing.addEntry('total', totalTime, 'Total request time from start to finish');

        // Build Server-Timing header
        const timingEntries: string[] = [];

        for (const [, entry] of timingContext.entries) {
            if (entry.duration !== undefined) {
                let timingValue = `${entry.name};dur=${entry.duration.toFixed(2)}`;
                if (entry.description) {
                    timingValue += `;desc="${entry.description}"`;
                }
                timingEntries.push(timingValue);
            }
        }

        // Set Server-Timing header (Vercel strips Server-Timing in production)
        if (timingEntries.length > 0) {
            const headerName =
                process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
                    ? 'X-Server-Timing'
                    : 'Server-Timing';
            c.header(headerName, timingEntries.join(', '));
        }
    } catch (error) {
        c.timing.end('request');
        c.timing.end('middleware');

        // Add error timing
        const totalTime = performance.now() - timingContext.requestStart;
        c.timing.addEntry('total', totalTime, 'Total request time (with error)');
        c.timing.addEntry('error', 0, 'Request failed with error');

        throw error;
    }
}
