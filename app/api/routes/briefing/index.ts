import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import { handleGetBriefingsForUser } from '@/app/api/handlers/briefing';
import { requireBilling } from '../../middleware/billing';

const briefing = new Hono();

briefing.use('*', requireAuth, requireBilling);

briefing.get('/', handleGetBriefingsForUser);

export default briefing;
