import { and, eq, desc, asc, count, inArray, max } from 'drizzle-orm';
import { db } from '../index';
import { company } from '../schema/company';
import { page } from '../schema/page';
import { snapshot } from '../schema/snapshot';
import type { PaginationOptions, PaginatedResult } from './types';

export const snapshotQueries = {
    async createSnapshot(pageId: string, pageURL: string, snapshotDiff: string) {
        const [newSnapshot] = await db
            .insert(snapshot)
            .values({
                pageId: pageId,
                pageURL: pageURL,
                diff: snapshotDiff,
            })
            .returning();

        return newSnapshot;
    },

    async createArchiveSnapshotsForPage(pageId: string, pageURL: string, snapshotDiff: string) {
        // Check if there is an existing snapshot for the page id
        const existingSnapshot = await db
            .select()
            .from(snapshot)
            .where(eq(snapshot.pageId, pageId));

        let createdAt = new Date();

        // If there is no existing snapshot, set the createdAt to 90 days ago
        if (existingSnapshot.length == 0) {
            createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - 90);
        }

        const [newSnapshot] = await db
            .insert(snapshot)
            .values({
                pageId: pageId,
                pageURL: pageURL,
                diff: snapshotDiff,
                createdAt: createdAt,
            })
            .returning();

        return newSnapshot;
    },

    /**
     * Get the last snapshot for a page
     * @param pageId - The ID of the page to get the last snapshot for
     * @param pageURL - The URL of the page to get the last snapshot for
     * @returns The last snapshot for the page
     */
    async getLastSnapshotForPage(pageId: string, pageURL: string) {
        const [lastSnapshot] = await db
            .select()
            .from(snapshot)
            .where(and(eq(snapshot.pageId, pageId), eq(snapshot.pageURL, pageURL)))
            .orderBy(desc(snapshot.createdAt))
            .limit(1);

        return lastSnapshot;
    },

    async listSnapshotsForPage(
        pageId: string,
        pageURL: string,
        options: PaginationOptions = {},
    ): Promise<PaginatedResult<typeof snapshot.$inferSelect>> {
        const {
            page: currentPage = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const offset = (currentPage - 1) * pageSize;
        const orderByColumn = sortBy === 'updatedAt' ? snapshot.updatedAt : snapshot.createdAt;
        const orderDirection = sortOrder === 'asc' ? asc : desc;

        const [{ count: totalItems }] = await db
            .select({ count: count() })
            .from(snapshot)
            .where(and(eq(snapshot.pageId, pageId), eq(snapshot.pageURL, pageURL)));

        const totalPages = Math.ceil(totalItems / pageSize);

        const snapshots = await db
            .select()
            .from(snapshot)
            .where(and(eq(snapshot.pageId, pageId), eq(snapshot.pageURL, pageURL)))
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

    async getLastSnapshotsForPages(pageIds: string[]) {
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

        // Get the actual snapshots
        const result = await db
            .select()
            .from(snapshot)
            .where(
                and(
                    inArray(snapshot.pageId, pageIds),
                    inArray(
                        snapshot.id,
                        latestSnapshots.map((item) => item.maxId!),
                    ),
                ),
            );

        return result;
    },

    async getLastSnapshotsForCompany(companyId: string) {
        // Verify company belongs to user
        const companyExists = await db.query.company.findFirst({
            where: and(eq(company.id, companyId), eq(company.isActive, true)),
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
        return await this.getLastSnapshotsForPages(pageIds);
    },

    async getSnapshotById(snapshotId: number) {
        const [result] = await db
            .select()
            .from(snapshot)
            .where(eq(snapshot.id, snapshotId))
            .limit(1);

        if (!result) {
            throw new Error('Snapshot not found');
        }

        return result;
    },
};
