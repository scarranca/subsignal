import { serve } from 'inngest/next';
import { inngest } from '../../../ingest/client';
import { functions } from '../../../ingest/functions';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions,
});
