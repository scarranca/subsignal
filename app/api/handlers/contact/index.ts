import { Context } from 'hono';
import { contactQueries, activityQueries } from '@/db/queries';
import { createContactSchema, updateContactSchema, contactFilterSchema, paginationSchema } from '@/schema/api';
import { z } from 'zod';
import { getUser } from '@/app/api/middleware/auth';

export async function handleGetContacts(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const pagination = paginationSchema.parse(query);
        const filters = contactFilterSchema.parse(query);

        const result = await contactQueries.getUserContacts(user.id, {
            ...pagination,
            ...filters,
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
        }
        console.error('Error fetching contacts:', error);
        return c.json({ error: 'Failed to fetch contacts' }, 500);
    }
}

export async function handleGetContact(c: Context) {
    try {
        const user = getUser(c);
        const contactId = c.req.param('id');

        if (!contactId) {
            return c.json({ error: 'Contact ID is required' }, 400);
        }

        const result = await contactQueries.getContactById(contactId, user.id);
        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Contact not found') {
            return c.json({ error: 'Contact not found' }, 404);
        }
        console.error('Error fetching contact:', error);
        return c.json({ error: 'Failed to fetch contact' }, 500);
    }
}

export async function handleCreateContact(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const validatedData = createContactSchema.parse(body);

        const contact = await contactQueries.createContact(user.id, {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName || null,
            email: validatedData.email || null,
            phone: validatedData.phone || null,
            title: validatedData.title || null,
            department: validatedData.department || null,
            companyId: validatedData.companyId || null,
            linkedinUrl: validatedData.linkedinUrl || null,
            twitterUrl: validatedData.twitterUrl || null,
            status: validatedData.status,
            source: validatedData.source,
            avatarUrl: validatedData.avatarUrl || null,
            notes: validatedData.notes || null,
            customFields: validatedData.customFields,
        });

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'contact',
            entityId: contact.id,
            entityName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
            action: 'created',
            description: `Created contact ${contact.firstName} ${contact.lastName || ''}`.trim(),
        });

        return c.json(contact, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        console.error('Error creating contact:', error);
        return c.json({ error: 'Failed to create contact' }, 500);
    }
}

export async function handleUpdateContact(c: Context) {
    try {
        const user = getUser(c);
        const contactId = c.req.param('id');
        const body = await c.req.json();

        if (!contactId) {
            return c.json({ error: 'Contact ID is required' }, 400);
        }

        const validatedData = updateContactSchema.parse(body);

        const updatedContact = await contactQueries.updateContact(contactId, user.id, validatedData);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'contact',
            entityId: updatedContact.id,
            entityName: `${updatedContact.firstName} ${updatedContact.lastName || ''}`.trim(),
            action: 'updated',
            description: `Updated contact ${updatedContact.firstName} ${updatedContact.lastName || ''}`.trim(),
            changes: { after: validatedData },
        });

        return c.json(updatedContact);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid data', details: error.errors }, 400);
        }
        if (error instanceof Error && error.message === 'Contact not found') {
            return c.json({ error: 'Contact not found' }, 404);
        }
        console.error('Error updating contact:', error);
        return c.json({ error: 'Failed to update contact' }, 500);
    }
}

export async function handleDeleteContact(c: Context) {
    try {
        const user = getUser(c);
        const contactId = c.req.param('id');

        if (!contactId) {
            return c.json({ error: 'Contact ID is required' }, 400);
        }

        // Get contact before deletion for activity log
        const contact = await contactQueries.getContactById(contactId, user.id);

        const result = await contactQueries.deleteContact(contactId, user.id);

        // Log activity
        await activityQueries.logActivity(user.id, {
            entityType: 'contact',
            entityId: contactId,
            entityName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
            action: 'deleted',
            description: `Deleted contact ${contact.firstName} ${contact.lastName || ''}`.trim(),
        });

        return c.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Contact not found') {
            return c.json({ error: 'Contact not found' }, 404);
        }
        console.error('Error deleting contact:', error);
        return c.json({ error: 'Failed to delete contact' }, 500);
    }
}
