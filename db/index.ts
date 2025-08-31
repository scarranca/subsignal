import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema, relations } from './schema';

const connectionString =
    process.env['DATABASE_URL'] || 'postgresql://postgres:password@localhost:5432/subsignal';

// Create the connection with pooling
const sql = postgres(connectionString, {
    max: 20, // Maximum connections in pool
    idle_timeout: 20, // Seconds before idle connections are closed
    connect_timeout: 10, // Connection timeout
    prepare: false, // Disable prepared statements for better compatibility
});

// Create the database instance with both schema and relations
export const db = drizzle(sql, { schema: { ...schema, ...relations } });
