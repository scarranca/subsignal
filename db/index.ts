import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema, relations } from './schema';

const connectionString =
    process.env['DATABASE_URL'] || 'postgresql://postgres:password@localhost:5432/subsignal';

// Create the connection
const sql = postgres(connectionString);

// Create the database instance with both schema and relations
export const db = drizzle(sql, { schema: { ...schema, ...relations } });
