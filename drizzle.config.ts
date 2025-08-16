import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// FOR PRODUCTION_PREVIEW
// config({ path: '.env.prod' });

// FOR LOCAL_DEVELOPEMENT
config({ path: '.env.local' });

export default {
    schema: './db/schema',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/subsignal',
    },
} satisfies Config;
