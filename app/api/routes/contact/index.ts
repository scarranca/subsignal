import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetContacts,
    handleGetContact,
    handleCreateContact,
    handleUpdateContact,
    handleDeleteContact,
} from '@/app/api/handlers/contact';
import { requireBilling } from '@/app/api/middleware/billing';

const contacts = new Hono();

// Apply auth middleware to all contact routes
contacts.use('*', requireAuth);

// Apply billing middleware
contacts.use('*', requireBilling);

// GET /api/v1/contacts - List contacts with pagination and filters
contacts.get('/', handleGetContacts);

// GET /api/v1/contacts/:id - Get specific contact
contacts.get('/:id', handleGetContact);

// POST /api/v1/contacts - Create new contact
contacts.post('/', handleCreateContact);

// PATCH /api/v1/contacts/:id - Update contact
contacts.patch('/:id', handleUpdateContact);

// DELETE /api/v1/contacts/:id - Soft delete contact
contacts.delete('/:id', handleDeleteContact);

export default contacts;
