import { and, eq, desc, asc, count, inArray, max } from 'drizzle-orm';
import { db } from '../index';
import { company } from '../schema/company';
import { page } from '../schema/page';
import { snapshot } from '../schema/snapshot';
import type { PaginationOptions, PaginatedResult } from './types';

export const snapshotQueries = {
    async createSnapshot(pageId: string, diff: string, userId: string) {
        // Verify page exists and belongs to user
        const pageWithCompany = await db
            .select({
                page: page,
                company: {
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(eq(page.id, pageId))
            .limit(1);

        const existingPage = pageWithCompany[0];

        if (
            !existingPage ||
            existingPage.company.userId !== userId ||
            !existingPage.page.isActive ||
            !existingPage.company.isActive
        ) {
            throw new Error('Page not found');
        }

        const [newSnapshot] = await db
            .insert(snapshot)
            .values({
                pageId: pageId,
                pageURL: existingPage.page.url,
                diff: diff,
            })
            .returning();

        return newSnapshot;
    },

    async getLastSnapshotForPage(pageId: string, userId: string) {
        // Verify page belongs to user and get the latest snapshot
        const result = await db
            .select({
                snapshot: snapshot,
                page: page,
                company: {
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(snapshot)
            .innerJoin(page, eq(snapshot.pageId, page.id))
            .innerJoin(company, eq(page.companyId, company.id))
            .where(eq(snapshot.pageId, pageId))
            .orderBy(desc(snapshot.createdAt))
            .limit(1);

        const snapshotWithPage = result[0];

        if (
            !snapshotWithPage ||
            snapshotWithPage.company.userId !== userId ||
            !snapshotWithPage.page.isActive ||
            !snapshotWithPage.company.isActive
        ) {
            return null;
        }

        return {
            ...snapshotWithPage.snapshot,
            page: snapshotWithPage.page,
        };
    },

    async listSnapshotsForPage(
        pageId: string,
        userId: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof snapshot.$inferSelect>> {
        // Verify page belongs to user
        const pageCheck = await db
            .select({
                company: {
                    userId: company.userId,
                    isActive: company.isActive,
                },
                page: {
                    isActive: page.isActive,
                },
            })
            .from(page)
            .innerJoin(company, eq(page.companyId, company.id))
            .where(eq(page.id, pageId))
            .limit(1);

        const pageWithCompany = pageCheck[0];

        if (
            !pageWithCompany ||
            pageWithCompany.company.userId !== userId ||
            !pageWithCompany.page.isActive ||
            !pageWithCompany.company.isActive
        ) {
            throw new Error('Page not found');
        }

        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn = sortBy === 'updatedAt' ? snapshot.updatedAt : snapshot.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        // Get total count
        const [{ count: totalItems }] = await db
            .select({ count: count() })
            .from(snapshot)
            .where(eq(snapshot.pageId, pageId));

        const totalPages = Math.ceil(totalItems / pageSize);

        // Get paginated snapshots
        const snapshots = await db
            .select()
            .from(snapshot)
            .where(eq(snapshot.pageId, pageId))
            .orderBy(orderDirection(orderByColumn))
            .limit(pageSize)
            .offset(offset);

        return {
            data: snapshots,
            pagination: {
                page: currentPage,
                pageSize,
                totalItems,
                totalPages,
                hasNext: currentPage < totalPages,
                hasPrevious: currentPage > 1,
            },
        };
    },

    async getLastSnapshotsForPages(pageIds: string[], userId: string) {
        if (pageIds.length === 0) {
            return [];
        }

        // Get the latest snapshot ID for each page (more reliable than timestamps)
        const latestSnapshots = await db
            .select({
                pageId: snapshot.pageId,
                maxId: max(snapshot.id).as('maxId'),
            })
            .from(snapshot)
            .where(inArray(snapshot.pageId, pageIds))
            .groupBy(snapshot.pageId);

        if (latestSnapshots.length === 0) {
            return [];
        }

        // Get the actual snapshots with their page and company info
        const result = await db
            .select({
                snapshot: snapshot,
                page: page,
                company: {
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(snapshot)
            .innerJoin(page, eq(snapshot.pageId, page.id))
            .innerJoin(company, eq(page.companyId, company.id))
            .where(
                and(
                    inArray(snapshot.pageId, pageIds),
                    inArray(
                        snapshot.id,
                        latestSnapshots.map((item) => item.maxId!),
                    ),
                ),
            );

        // Filter out unauthorized results
        const authorizedSnapshots = result.filter(
            (item) => item.company.userId === userId && item.page.isActive && item.company.isActive,
        );

        return authorizedSnapshots.map((item) => ({
            ...item.snapshot,
            page: item.page,
        }));
    },

    async getLastSnapshotsForCompany(companyId: string, userId: string) {
        // Verify company belongs to user
        const companyExists = await db.query.company.findFirst({
            where: and(
                eq(company.id, companyId),
                eq(company.userId, userId),
                eq(company.isActive, true),
            ),
        });

        if (!companyExists) {
            throw new Error('Company not found');
        }

        // Get all active pages for the company
        const companyPages = await db
            .select({ id: page.id })
            .from(page)
            .where(and(eq(page.companyId, companyId), eq(page.isActive, true)));

        const pageIds = companyPages.map((p) => p.id);

        if (pageIds.length === 0) {
            return [];
        }

        // Get latest snapshots for all pages in the company
        return await this.getLastSnapshotsForPages(pageIds, userId);
    },

    async getSnapshotById(snapshotId: number, userId: string) {
        const result = await db
            .select({
                snapshot: snapshot,
                page: page,
                company: {
                    id: company.id,
                    name: company.name,
                    userId: company.userId,
                    isActive: company.isActive,
                },
            })
            .from(snapshot)
            .innerJoin(page, eq(snapshot.pageId, page.id))
            .innerJoin(company, eq(page.companyId, company.id))
            .where(eq(snapshot.id, snapshotId))
            .limit(1);

        const snapshotWithDetails = result[0];

        if (
            !snapshotWithDetails ||
            snapshotWithDetails.company.userId !== userId ||
            !snapshotWithDetails.page.isActive ||
            !snapshotWithDetails.company.isActive
        ) {
            throw new Error('Snapshot not found');
        }

        return {
            ...snapshotWithDetails.snapshot,
            page: snapshotWithDetails.page,
            company: snapshotWithDetails.company,
        };
    },

    async deleteSnapshotById(snapshotId: number, userId: string) {
        // First verify the snapshot exists and belongs to user
        const existingSnapshot = await this.getSnapshotById(snapshotId, userId);

        // Delete the snapshot record
        const [deletedSnapshot] = await db
            .delete(snapshot)
            .where(eq(snapshot.id, snapshotId))
            .returning();

        return deletedSnapshot;
    },
};
