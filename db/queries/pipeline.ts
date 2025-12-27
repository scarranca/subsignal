import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { pipeline, pipelineStage, defaultPipelineStages } from '@/db/schema';
import { nanoid } from 'nanoid';
import type { PipelineSelect, PipelineStageSelect, PipelineInsert, PipelineStageInsert } from '@/db/schema';

export type PipelineWithStages = PipelineSelect & {
    stages: PipelineStageSelect[];
};

export const pipelineQueries = {
    // ============== Organization-scoped Methods ==============

    async createPipelineForOrg(
        organizationId: string,
        userId: string,
        data: {
            name: string;
            description?: string;
            isDefault?: boolean;
            stages: Array<{
                name: string;
                color?: string;
                probability?: number;
                position: number;
                isWonStage?: boolean;
                isLostStage?: boolean;
            }>;
        }
    ): Promise<PipelineWithStages> {
        const pipelineId = nanoid();
        const now = new Date();

        // If this is set as default, unset other defaults
        if (data.isDefault) {
            await db
                .update(pipeline)
                .set({ isDefault: false, updatedAt: now })
                .where(and(eq(pipeline.organizationId, organizationId), eq(pipeline.isDefault, true)));
        }

        // Create pipeline
        const [newPipeline] = await db
            .insert(pipeline)
            .values({
                id: pipelineId,
                organizationId,
                userId,
                name: data.name,
                description: data.description,
                isDefault: data.isDefault ?? false,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Create stages
        const stageValues = data.stages.map((stage) => ({
            id: nanoid(),
            pipelineId,
            name: stage.name,
            color: stage.color ?? '#6B7280',
            probability: stage.probability ?? 0,
            position: stage.position,
            isWonStage: stage.isWonStage ?? false,
            isLostStage: stage.isLostStage ?? false,
            createdAt: now,
            updatedAt: now,
        }));

        const stages = await db.insert(pipelineStage).values(stageValues).returning();

        return {
            ...newPipeline,
            stages: stages.sort((a, b) => a.position - b.position),
        };
    },

    async createDefaultPipelineForOrg(organizationId: string, userId: string): Promise<PipelineWithStages> {
        const stages = defaultPipelineStages.map((stage, index) => ({
            name: stage.name,
            color: stage.color,
            probability: stage.probability,
            position: index,
            isWonStage: stage.name === 'Closed Won',
            isLostStage: stage.name === 'Closed Lost',
        }));

        return this.createPipelineForOrg(organizationId, userId, {
            name: 'Sales Pipeline',
            description: 'Default sales pipeline',
            isDefault: true,
            stages,
        });
    },

    async getPipelineByIdForOrg(pipelineId: string, organizationId: string): Promise<PipelineWithStages> {
        const result = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.id, pipelineId), eq(pipeline.organizationId, organizationId), eq(pipeline.isActive, true)),
            with: {
                stages: {
                    orderBy: [asc(pipelineStage.position)],
                },
            },
        });

        if (!result) {
            throw new Error('Pipeline not found');
        }

        return result;
    },

    async getOrganizationPipelines(organizationId: string): Promise<PipelineWithStages[]> {
        const pipelines = await db.query.pipeline.findMany({
            where: and(eq(pipeline.organizationId, organizationId), eq(pipeline.isActive, true)),
            with: {
                stages: {
                    orderBy: [asc(pipelineStage.position)],
                },
            },
            orderBy: [desc(pipeline.isDefault), asc(pipeline.name)],
        });

        return pipelines;
    },

    async getDefaultPipelineForOrg(organizationId: string): Promise<PipelineWithStages | null> {
        const result = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.organizationId, organizationId), eq(pipeline.isDefault, true), eq(pipeline.isActive, true)),
            with: {
                stages: {
                    orderBy: [asc(pipelineStage.position)],
                },
            },
        });

        return result || null;
    },

    async updatePipelineForOrg(
        pipelineId: string,
        organizationId: string,
        data: Partial<Pick<PipelineInsert, 'name' | 'description' | 'isDefault'>>
    ): Promise<PipelineSelect> {
        const now = new Date();

        // If setting as default, unset other defaults
        if (data.isDefault) {
            await db
                .update(pipeline)
                .set({ isDefault: false, updatedAt: now })
                .where(and(eq(pipeline.organizationId, organizationId), eq(pipeline.isDefault, true)));
        }

        const [updated] = await db
            .update(pipeline)
            .set({ ...data, updatedAt: now })
            .where(and(eq(pipeline.id, pipelineId), eq(pipeline.organizationId, organizationId)))
            .returning();

        if (!updated) {
            throw new Error('Pipeline not found');
        }

        return updated;
    },

    async updatePipelineStageForOrg(
        stageId: string,
        organizationId: string,
        data: Partial<Pick<PipelineStageInsert, 'name' | 'color' | 'probability' | 'position' | 'isWonStage' | 'isLostStage'>>
    ): Promise<PipelineStageSelect> {
        // Verify ownership through pipeline
        const stage = await db.query.pipelineStage.findFirst({
            where: eq(pipelineStage.id, stageId),
            with: {
                pipeline: true,
            },
        });

        if (!stage || stage.pipeline.organizationId !== organizationId) {
            throw new Error('Stage not found');
        }

        const [updated] = await db
            .update(pipelineStage)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(pipelineStage.id, stageId))
            .returning();

        return updated;
    },

    async addPipelineStageForOrg(
        pipelineId: string,
        organizationId: string,
        data: {
            name: string;
            color?: string;
            probability?: number;
            position: number;
            isWonStage?: boolean;
            isLostStage?: boolean;
        }
    ): Promise<PipelineStageSelect> {
        // Verify ownership
        const pipelineRecord = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.id, pipelineId), eq(pipeline.organizationId, organizationId)),
        });

        if (!pipelineRecord) {
            throw new Error('Pipeline not found');
        }

        const now = new Date();
        const [newStage] = await db
            .insert(pipelineStage)
            .values({
                id: nanoid(),
                pipelineId,
                name: data.name,
                color: data.color ?? '#6B7280',
                probability: data.probability ?? 0,
                position: data.position,
                isWonStage: data.isWonStage ?? false,
                isLostStage: data.isLostStage ?? false,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return newStage;
    },

    async deletePipelineStageForOrg(stageId: string, organizationId: string): Promise<{ success: boolean }> {
        // Verify ownership through pipeline
        const stage = await db.query.pipelineStage.findFirst({
            where: eq(pipelineStage.id, stageId),
            with: {
                pipeline: true,
            },
        });

        if (!stage || stage.pipeline.organizationId !== organizationId) {
            throw new Error('Stage not found');
        }

        await db.delete(pipelineStage).where(eq(pipelineStage.id, stageId));

        return { success: true };
    },

    async deletePipelineForOrg(pipelineId: string, organizationId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(pipeline)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(pipeline.id, pipelineId), eq(pipeline.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            throw new Error('Pipeline not found');
        }

        return { success: true };
    },

    async reorderStagesForOrg(
        pipelineId: string,
        organizationId: string,
        stages: Array<{ id: string; position: number }>
    ): Promise<PipelineStageSelect[]> {
        // Verify ownership
        const pipelineRecord = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.id, pipelineId), eq(pipeline.organizationId, organizationId)),
        });

        if (!pipelineRecord) {
            throw new Error('Pipeline not found');
        }

        const now = new Date();
        const updatedStages: PipelineStageSelect[] = [];

        for (const stage of stages) {
            const [updated] = await db
                .update(pipelineStage)
                .set({ position: stage.position, updatedAt: now })
                .where(and(eq(pipelineStage.id, stage.id), eq(pipelineStage.pipelineId, pipelineId)))
                .returning();

            if (updated) {
                updatedStages.push(updated);
            }
        }

        return updatedStages.sort((a, b) => a.position - b.position);
    },

    // ============== Legacy User-scoped Methods (for backwards compatibility) ==============

    async createPipeline(
        userId: string,
        data: {
            name: string;
            description?: string;
            isDefault?: boolean;
            stages: Array<{
                name: string;
                color?: string;
                probability?: number;
                position: number;
                isWonStage?: boolean;
                isLostStage?: boolean;
            }>;
        }
    ): Promise<PipelineWithStages> {
        const pipelineId = nanoid();
        const now = new Date();

        // If this is set as default, unset other defaults
        if (data.isDefault) {
            await db
                .update(pipeline)
                .set({ isDefault: false, updatedAt: now })
                .where(and(eq(pipeline.userId, userId), eq(pipeline.isDefault, true)));
        }

        // Create pipeline
        const [newPipeline] = await db
            .insert(pipeline)
            .values({
                id: pipelineId,
                userId,
                name: data.name,
                description: data.description,
                isDefault: data.isDefault ?? false,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Create stages
        const stageValues = data.stages.map((stage) => ({
            id: nanoid(),
            pipelineId,
            name: stage.name,
            color: stage.color ?? '#6B7280',
            probability: stage.probability ?? 0,
            position: stage.position,
            isWonStage: stage.isWonStage ?? false,
            isLostStage: stage.isLostStage ?? false,
            createdAt: now,
            updatedAt: now,
        }));

        const stages = await db.insert(pipelineStage).values(stageValues).returning();

        return {
            ...newPipeline,
            stages: stages.sort((a, b) => a.position - b.position),
        };
    },

    async createDefaultPipeline(userId: string): Promise<PipelineWithStages> {
        const stages = defaultPipelineStages.map((stage, index) => ({
            name: stage.name,
            color: stage.color,
            probability: stage.probability,
            position: index,
            isWonStage: stage.name === 'Closed Won',
            isLostStage: stage.name === 'Closed Lost',
        }));

        return this.createPipeline(userId, {
            name: 'Sales Pipeline',
            description: 'Default sales pipeline',
            isDefault: true,
            stages,
        });
    },

    async getPipelineById(pipelineId: string, userId: string): Promise<PipelineWithStages> {
        const result = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.id, pipelineId), eq(pipeline.userId, userId), eq(pipeline.isActive, true)),
            with: {
                stages: {
                    orderBy: [asc(pipelineStage.position)],
                },
            },
        });

        if (!result) {
            throw new Error('Pipeline not found');
        }

        return result;
    },

    async getUserPipelines(userId: string): Promise<PipelineWithStages[]> {
        const pipelines = await db.query.pipeline.findMany({
            where: and(eq(pipeline.userId, userId), eq(pipeline.isActive, true)),
            with: {
                stages: {
                    orderBy: [asc(pipelineStage.position)],
                },
            },
            orderBy: [desc(pipeline.isDefault), asc(pipeline.name)],
        });

        return pipelines;
    },

    async getDefaultPipeline(userId: string): Promise<PipelineWithStages | null> {
        const result = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.userId, userId), eq(pipeline.isDefault, true), eq(pipeline.isActive, true)),
            with: {
                stages: {
                    orderBy: [asc(pipelineStage.position)],
                },
            },
        });

        return result || null;
    },

    async updatePipeline(
        pipelineId: string,
        userId: string,
        data: Partial<Pick<PipelineInsert, 'name' | 'description' | 'isDefault'>>
    ): Promise<PipelineSelect> {
        const now = new Date();

        // If setting as default, unset other defaults
        if (data.isDefault) {
            await db
                .update(pipeline)
                .set({ isDefault: false, updatedAt: now })
                .where(and(eq(pipeline.userId, userId), eq(pipeline.isDefault, true)));
        }

        const [updated] = await db
            .update(pipeline)
            .set({ ...data, updatedAt: now })
            .where(and(eq(pipeline.id, pipelineId), eq(pipeline.userId, userId)))
            .returning();

        if (!updated) {
            throw new Error('Pipeline not found');
        }

        return updated;
    },

    async updatePipelineStage(
        stageId: string,
        userId: string,
        data: Partial<Pick<PipelineStageInsert, 'name' | 'color' | 'probability' | 'position' | 'isWonStage' | 'isLostStage'>>
    ): Promise<PipelineStageSelect> {
        // Verify ownership through pipeline
        const stage = await db.query.pipelineStage.findFirst({
            where: eq(pipelineStage.id, stageId),
            with: {
                pipeline: true,
            },
        });

        if (!stage || stage.pipeline.userId !== userId) {
            throw new Error('Stage not found');
        }

        const [updated] = await db
            .update(pipelineStage)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(pipelineStage.id, stageId))
            .returning();

        return updated;
    },

    async addPipelineStage(
        pipelineId: string,
        userId: string,
        data: {
            name: string;
            color?: string;
            probability?: number;
            position: number;
            isWonStage?: boolean;
            isLostStage?: boolean;
        }
    ): Promise<PipelineStageSelect> {
        // Verify ownership
        const pipelineRecord = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.id, pipelineId), eq(pipeline.userId, userId)),
        });

        if (!pipelineRecord) {
            throw new Error('Pipeline not found');
        }

        const now = new Date();
        const [newStage] = await db
            .insert(pipelineStage)
            .values({
                id: nanoid(),
                pipelineId,
                name: data.name,
                color: data.color ?? '#6B7280',
                probability: data.probability ?? 0,
                position: data.position,
                isWonStage: data.isWonStage ?? false,
                isLostStage: data.isLostStage ?? false,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return newStage;
    },

    async deletePipelineStage(stageId: string, userId: string): Promise<{ success: boolean }> {
        // Verify ownership through pipeline
        const stage = await db.query.pipelineStage.findFirst({
            where: eq(pipelineStage.id, stageId),
            with: {
                pipeline: true,
            },
        });

        if (!stage || stage.pipeline.userId !== userId) {
            throw new Error('Stage not found');
        }

        await db.delete(pipelineStage).where(eq(pipelineStage.id, stageId));

        return { success: true };
    },

    async deletePipeline(pipelineId: string, userId: string): Promise<{ success: boolean }> {
        const [deleted] = await db
            .update(pipeline)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(eq(pipeline.id, pipelineId), eq(pipeline.userId, userId)))
            .returning();

        if (!deleted) {
            throw new Error('Pipeline not found');
        }

        return { success: true };
    },

    async reorderStages(
        pipelineId: string,
        userId: string,
        stages: Array<{ id: string; position: number }>
    ): Promise<PipelineStageSelect[]> {
        // Verify ownership
        const pipelineRecord = await db.query.pipeline.findFirst({
            where: and(eq(pipeline.id, pipelineId), eq(pipeline.userId, userId)),
        });

        if (!pipelineRecord) {
            throw new Error('Pipeline not found');
        }

        const now = new Date();
        const updatedStages: PipelineStageSelect[] = [];

        for (const stage of stages) {
            const [updated] = await db
                .update(pipelineStage)
                .set({ position: stage.position, updatedAt: now })
                .where(and(eq(pipelineStage.id, stage.id), eq(pipelineStage.pipelineId, pipelineId)))
                .returning();

            if (updated) {
                updatedStages.push(updated);
            }
        }

        return updatedStages.sort((a, b) => a.position - b.position);
    },
};
