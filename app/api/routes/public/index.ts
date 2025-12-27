import { Hono } from 'hono';
import { requireApiKey, hasWritePermission } from '@/app/api/middleware/apiKeyAuth';
import { db } from '@/db';
import { contact, company, deal, interaction, task } from '@/db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';

const publicApi = new Hono();

/**
 * Public API v1 - Authenticated via API Key
 * These endpoints allow external systems to push and pull data
 */

// ============== CONTACTS ==============

// GET /public/v1/contacts - List contacts
publicApi.get('/v1/contacts', requireApiKey(['contacts:read']), async (c) => {
    const userId = c.get('userId');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');
    const search = c.req.query('search');

    let query = db.select().from(contact).where(eq(contact.userId, userId));

    if (search) {
        query = query.where(
            and(
                eq(contact.userId, userId),
                or(
                    like(contact.email, `%${search}%`),
                    like(contact.firstName, `%${search}%`),
                    like(contact.lastName, `%${search}%`)
                )
            )
        ) as any;
    }

    const contacts = await query.orderBy(desc(contact.createdAt)).limit(limit).offset(offset);

    return c.json({ contacts, limit, offset });
});

// GET /public/v1/contacts/:id - Get contact
publicApi.get('/v1/contacts/:id', requireApiKey(['contacts:read']), async (c) => {
    const userId = c.get('userId');
    const contactId = c.req.param('id');

    const [record] = await db
        .select()
        .from(contact)
        .where(and(eq(contact.id, contactId), eq(contact.userId, userId)));

    if (!record) {
        return c.json({ error: 'Contact not found' }, 404);
    }

    return c.json({ contact: record });
});

// POST /public/v1/contacts - Create contact
publicApi.post('/v1/contacts', requireApiKey(['contacts:write']), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!body.email) {
        return c.json({ error: 'Email is required' }, 400);
    }

    // Check for duplicate
    const [existing] = await db
        .select()
        .from(contact)
        .where(and(eq(contact.userId, userId), eq(contact.email, body.email)));

    if (existing) {
        return c.json({ error: 'Contact with this email already exists', existingId: existing.id }, 409);
    }

    const [created] = await db
        .insert(contact)
        .values({
            userId,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            title: body.title,
            companyId: body.companyId,
            source: body.source || 'api',
            status: body.status || 'active',
            notes: body.notes,
            linkedinUrl: body.linkedinUrl,
            twitterHandle: body.twitterHandle,
            address: body.address,
            city: body.city,
            state: body.state,
            country: body.country,
            postalCode: body.postalCode,
            customFields: body.customFields,
        })
        .returning();

    return c.json({ contact: created }, 201);
});

// PATCH /public/v1/contacts/:id - Update contact
publicApi.patch('/v1/contacts/:id', requireApiKey(['contacts:write']), async (c) => {
    const userId = c.get('userId');
    const contactId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
        .select()
        .from(contact)
        .where(and(eq(contact.id, contactId), eq(contact.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Contact not found' }, 404);
    }

    const updateFields: any = { updatedAt: new Date() };
    const allowedFields = [
        'email', 'firstName', 'lastName', 'phone', 'title', 'companyId',
        'source', 'status', 'notes', 'linkedinUrl', 'twitterHandle',
        'address', 'city', 'state', 'country', 'postalCode', 'customFields',
    ];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updateFields[field] = body[field];
        }
    }

    const [updated] = await db
        .update(contact)
        .set(updateFields)
        .where(eq(contact.id, contactId))
        .returning();

    return c.json({ contact: updated });
});

// DELETE /public/v1/contacts/:id - Delete contact
publicApi.delete('/v1/contacts/:id', requireApiKey(['contacts:write']), async (c) => {
    const userId = c.get('userId');
    const contactId = c.req.param('id');

    const [existing] = await db
        .select()
        .from(contact)
        .where(and(eq(contact.id, contactId), eq(contact.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Contact not found' }, 404);
    }

    await db.delete(contact).where(eq(contact.id, contactId));

    return c.json({ success: true });
});

// ============== COMPANIES ==============

// GET /public/v1/companies - List companies
publicApi.get('/v1/companies', requireApiKey(['companies:read']), async (c) => {
    const userId = c.get('userId');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const companies = await db
        .select()
        .from(company)
        .where(eq(company.userId, userId))
        .orderBy(desc(company.createdAt))
        .limit(limit)
        .offset(offset);

    return c.json({ companies, limit, offset });
});

// POST /public/v1/companies - Create company
publicApi.post('/v1/companies', requireApiKey(['companies:write']), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!body.name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const [created] = await db
        .insert(company)
        .values({
            userId,
            name: body.name,
            domain: body.domain,
            website: body.website,
            industry: body.industry,
            size: body.size,
            type: body.type || 'prospect',
            description: body.description,
            phone: body.phone,
            address: body.address,
            city: body.city,
            state: body.state,
            country: body.country,
            postalCode: body.postalCode,
            linkedinUrl: body.linkedinUrl,
            annualRevenue: body.annualRevenue,
            employeeCount: body.employeeCount,
        })
        .returning();

    return c.json({ company: created }, 201);
});

// ============== DEALS ==============

// GET /public/v1/deals - List deals
publicApi.get('/v1/deals', requireApiKey(['deals:read']), async (c) => {
    const userId = c.get('userId');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const deals = await db
        .select()
        .from(deal)
        .where(eq(deal.userId, userId))
        .orderBy(desc(deal.createdAt))
        .limit(limit)
        .offset(offset);

    return c.json({ deals, limit, offset });
});

// POST /public/v1/deals - Create deal
publicApi.post('/v1/deals', requireApiKey(['deals:write']), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!body.name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const [created] = await db
        .insert(deal)
        .values({
            userId,
            name: body.name,
            value: body.value,
            currency: body.currency || 'USD',
            pipelineId: body.pipelineId,
            stageId: body.stageId,
            contactId: body.contactId,
            companyId: body.companyId,
            status: body.status || 'open',
            priority: body.priority || 'medium',
            expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
            probability: body.probability,
            notes: body.notes,
            lostReason: body.lostReason,
        })
        .returning();

    return c.json({ deal: created }, 201);
});

// PATCH /public/v1/deals/:id - Update deal
publicApi.patch('/v1/deals/:id', requireApiKey(['deals:write']), async (c) => {
    const userId = c.get('userId');
    const dealId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
        .select()
        .from(deal)
        .where(and(eq(deal.id, dealId), eq(deal.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Deal not found' }, 404);
    }

    const updateFields: any = { updatedAt: new Date() };
    const allowedFields = [
        'name', 'value', 'currency', 'stageId', 'contactId', 'companyId',
        'status', 'priority', 'expectedCloseDate', 'probability', 'notes',
        'lostReason', 'wonReason', 'closedAt',
    ];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            if (field === 'expectedCloseDate' || field === 'closedAt') {
                updateFields[field] = body[field] ? new Date(body[field]) : null;
            } else {
                updateFields[field] = body[field];
            }
        }
    }

    const [updated] = await db
        .update(deal)
        .set(updateFields)
        .where(eq(deal.id, dealId))
        .returning();

    return c.json({ deal: updated });
});

// ============== INTERACTIONS ==============

// GET /public/v1/interactions - List interactions
publicApi.get('/v1/interactions', requireApiKey(['interactions:read']), async (c) => {
    const userId = c.get('userId');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');
    const contactId = c.req.query('contactId');
    const dealId = c.req.query('dealId');

    let whereClause = eq(interaction.userId, userId);

    if (contactId) {
        whereClause = and(whereClause, eq(interaction.contactId, contactId)) as any;
    }
    if (dealId) {
        whereClause = and(whereClause, eq(interaction.dealId, dealId)) as any;
    }

    const interactions = await db
        .select()
        .from(interaction)
        .where(whereClause)
        .orderBy(desc(interaction.occurredAt))
        .limit(limit)
        .offset(offset);

    return c.json({ interactions, limit, offset });
});

// POST /public/v1/interactions - Create interaction
publicApi.post('/v1/interactions', requireApiKey(['interactions:write']), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!body.type) {
        return c.json({ error: 'Type is required' }, 400);
    }

    const [created] = await db
        .insert(interaction)
        .values({
            userId,
            type: body.type,
            direction: body.direction || 'outbound',
            contactId: body.contactId,
            companyId: body.companyId,
            dealId: body.dealId,
            subject: body.subject,
            notes: body.notes,
            outcome: body.outcome,
            durationMinutes: body.durationMinutes,
            occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
            metadata: body.metadata,
        })
        .returning();

    return c.json({ interaction: created }, 201);
});

// ============== TASKS ==============

// GET /public/v1/tasks - List tasks
publicApi.get('/v1/tasks', requireApiKey(['tasks:read']), async (c) => {
    const userId = c.get('userId');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const tasks = await db
        .select()
        .from(task)
        .where(eq(task.userId, userId))
        .orderBy(desc(task.dueDate))
        .limit(limit)
        .offset(offset);

    return c.json({ tasks, limit, offset });
});

// POST /public/v1/tasks - Create task
publicApi.post('/v1/tasks', requireApiKey(['tasks:write']), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!body.title) {
        return c.json({ error: 'Title is required' }, 400);
    }

    const [created] = await db
        .insert(task)
        .values({
            userId,
            title: body.title,
            description: body.description,
            type: body.type || 'todo',
            status: body.status || 'pending',
            priority: body.priority || 'medium',
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            contactId: body.contactId,
            companyId: body.companyId,
            dealId: body.dealId,
            assignedToId: body.assignedToId || userId,
        })
        .returning();

    return c.json({ task: created }, 201);
});

// PATCH /public/v1/tasks/:id - Update task
publicApi.patch('/v1/tasks/:id', requireApiKey(['tasks:write']), async (c) => {
    const userId = c.get('userId');
    const taskId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
        .select()
        .from(task)
        .where(and(eq(task.id, taskId), eq(task.userId, userId)));

    if (!existing) {
        return c.json({ error: 'Task not found' }, 404);
    }

    const updateFields: any = { updatedAt: new Date() };
    const allowedFields = [
        'title', 'description', 'type', 'status', 'priority',
        'dueDate', 'completedAt', 'contactId', 'companyId', 'dealId',
    ];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            if (field === 'dueDate' || field === 'completedAt') {
                updateFields[field] = body[field] ? new Date(body[field]) : null;
            } else {
                updateFields[field] = body[field];
            }
        }
    }

    const [updated] = await db
        .update(task)
        .set(updateFields)
        .where(eq(task.id, taskId))
        .returning();

    return c.json({ task: updated });
});

// ============== BULK OPERATIONS ==============

// POST /public/v1/bulk/contacts - Bulk create contacts
publicApi.post('/v1/bulk/contacts', requireApiKey(['contacts:write']), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!Array.isArray(body.contacts) || body.contacts.length === 0) {
        return c.json({ error: 'contacts array is required' }, 400);
    }

    if (body.contacts.length > 100) {
        return c.json({ error: 'Maximum 100 contacts per request' }, 400);
    }

    const results: { created: any[]; errors: any[] } = { created: [], errors: [] };

    for (const contactData of body.contacts) {
        try {
            if (!contactData.email) {
                results.errors.push({ data: contactData, error: 'Email is required' });
                continue;
            }

            // Check for duplicate
            const [existing] = await db
                .select()
                .from(contact)
                .where(and(eq(contact.userId, userId), eq(contact.email, contactData.email)));

            if (existing) {
                results.errors.push({
                    data: contactData,
                    error: 'Contact already exists',
                    existingId: existing.id,
                });
                continue;
            }

            const [created] = await db
                .insert(contact)
                .values({
                    userId,
                    email: contactData.email,
                    firstName: contactData.firstName,
                    lastName: contactData.lastName,
                    phone: contactData.phone,
                    title: contactData.title,
                    companyId: contactData.companyId,
                    source: contactData.source || 'api',
                    status: contactData.status || 'active',
                })
                .returning();

            results.created.push(created);
        } catch (err) {
            results.errors.push({
                data: contactData,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    return c.json(results, results.errors.length > 0 ? 207 : 201);
});

// POST /public/v1/bulk/interactions - Bulk create interactions
publicApi.post('/v1/bulk/interactions', requireApiKey(['interactions:write']), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    if (!Array.isArray(body.interactions) || body.interactions.length === 0) {
        return c.json({ error: 'interactions array is required' }, 400);
    }

    if (body.interactions.length > 100) {
        return c.json({ error: 'Maximum 100 interactions per request' }, 400);
    }

    const results: { created: any[]; errors: any[] } = { created: [], errors: [] };

    for (const interactionData of body.interactions) {
        try {
            if (!interactionData.type) {
                results.errors.push({ data: interactionData, error: 'Type is required' });
                continue;
            }

            const [created] = await db
                .insert(interaction)
                .values({
                    userId,
                    type: interactionData.type,
                    direction: interactionData.direction || 'outbound',
                    contactId: interactionData.contactId,
                    companyId: interactionData.companyId,
                    dealId: interactionData.dealId,
                    subject: interactionData.subject,
                    notes: interactionData.notes,
                    occurredAt: interactionData.occurredAt ? new Date(interactionData.occurredAt) : new Date(),
                    metadata: interactionData.metadata,
                })
                .returning();

            results.created.push(created);
        } catch (err) {
            results.errors.push({
                data: interactionData,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    return c.json(results, results.errors.length > 0 ? 207 : 201);
});

export default publicApi;
