import { eq, and, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { contact } from '@/db/schema';
import { nanoid } from 'nanoid';
import type { PaginationOptions, PaginatedResult } from './types';
import type { ContactSelect, ContactInsert } from '@/db/schema';

export type ContactWithCompany = ContactSelect & {
    company?: { id: string; name: string } | null;
    owner?: { id: string; name: string; email: string } | null;
};

export const contactQueries = {
    async createContact(
        organizationId: string,
        userId: string,
        data: Omit<ContactInsert, 'id' | 'organizationId' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<ContactSelect> {
        const id = nanoid();
        const now = new Date();

        const [newContact] = await db
            .insert(contact)
            .values({
                id,
                organizationId,
                userId,
                ownerId: data.ownerId || userId, // Default owner is creator
                ...data,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return newContact;
    },

    async getContactById(contactId: string, organizationId: string): Promise<ContactWithCompany> {
        const result = await db.query.contact.findFirst({
            where: and(
                eq(contact.id, contactId),
                eq(contact.organizationId, organizationId),
                eq(contact.isActive, true)
            ),
            with: {
                company: {
                    columns: { id: true, name: true },
                },
                owner: {
                    columns: { id: true, name: true, email: true },
                },
            },
        });

        if (!result) {
            throw new Error('Contact not found');
        }

        return result;
    },

    async getOrganizationContacts(
        organizationId: string,
        options: PaginationOptions & {
            status?: string;
            source?: string;
            companyId?: string;
            ownerId?: string;
            search?: string;
        } = {}
    ): Promise<PaginatedResult<ContactWithCompany>> {
        const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', status, source, companyId, ownerId, search } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(contact.organizationId, organizationId), eq(contact.isActive, true)];

        if (status) {
            conditions.push(eq(contact.status, status as any));
        }
        if (source) {
            conditions.push(eq(contact.source, source as any));
        }
        if (companyId) {
            conditions.push(eq(contact.companyId, companyId));
        }
        if (ownerId) {
            conditions.push(eq(contact.ownerId, ownerId));
        }
        if (search) {
            conditions.push(
                or(
                    ilike(contact.firstName, `%${search}%`),
                    ilike(contact.lastName, `%${search}%`),
                    ilike(contact.email, `%${search}%`)
                )!
            );
        }

        const orderByColumn = sortBy === 'name' ? contact.firstName : contact[sortBy as keyof typeof contact] || contact.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [contacts, countResult] = await Promise.all([
            db.query.contact.findMany({
                where: and(...conditions),
                with: {
                    company: {
                        columns: { id: true, name: true },
                    },
                    owner: {
                        columns: { id: true, name: true, email: true },
                    },
                },
                orderBy: [orderDirection(orderByColumn as any)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(contact)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: contacts,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    },

    // Keep legacy method for backwards compatibility during migration
    async getUserContacts(
        userId: string,
        options: PaginationOptions & {
            status?: string;
            source?: string;
            companyId?: string;
            search?: string;
        } = {}
    ): Promise<PaginatedResult<ContactWithCompany>> {
        const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', status, source, companyId, search } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(contact.userId, userId), eq(contact.isActive, true)];

        if (status) {
            conditions.push(eq(contact.status, status as any));
        }
        if (source) {
            conditions.push(eq(contact.source, source as any));
        }
        if (companyId) {
            conditions.push(eq(contact.companyId, companyId));
        }
        if (search) {
            conditions.push(
                or(
                    ilike(contact.firstName, `%${search}%`),
                    ilike(contact.lastName, `%${search}%`),
                    ilike(contact.email, `%${search}%`)
                )!
            );
        }

        const orderByColumn = sortBy === 'name' ? contact.firstName : contact[sortBy as keyof typeof contact] || contact.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [contacts, countResult] = await Promise.all([
            db.query.contact.findMany({
                where: and(...conditions),
                with: {
                    company: {
                        columns: { id: true, name: true },
                    },
                },
                orderBy: [orderDirection(orderByColumn as any)],
                limit: pageSize,
                offset,
            }),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(contact)
                .where(and(...conditions)),
        ]);

        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            data: contacts,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    },

    async updateContact(
        contactId: string,
        organizationId: string,
        data: Partial<Omit<ContactInsert, 'id' | 'organizationId' | 'userId' | 'createdAt'>>
    ): Promise<ContactSelect> {
        const [updatedContact] = await db
            .update(contact)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(contact.id, contactId), eq(contact.organizationId, organizationId)))
            .returning();

        if (!updatedContact) {
            throw new Error('Contact not found');
        }

        return updatedContact;
    },

    async deleteContact(contactId: string, organizationId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(contact)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(contact.id, contactId), eq(contact.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            throw new Error('Contact not found');
        }

        return { success: true };
    },

    async getContactCount(organizationId: string): Promise<number> {
        const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(contact)
            .where(and(eq(contact.organizationId, organizationId), eq(contact.isActive, true)));

        return result[0]?.count || 0;
    },

    async assignOwner(contactId: string, organizationId: string, ownerId: string): Promise<ContactSelect> {
        const [updated] = await db
            .update(contact)
            .set({ ownerId, updatedAt: new Date() })
            .where(and(eq(contact.id, contactId), eq(contact.organizationId, organizationId)))
            .returning();

        if (!updated) {
            throw new Error('Contact not found');
        }

        return updated;
    },

    async getContactsByOwner(organizationId: string, ownerId: string): Promise<ContactSelect[]> {
        return db.query.contact.findMany({
            where: and(
                eq(contact.organizationId, organizationId),
                eq(contact.ownerId, ownerId),
                eq(contact.isActive, true)
            ),
        });
    },
};
