import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { preference } from '../schema/preference';

export const preferenceQueries = {
    async getUserPreference(userId: string) {
        return await db.query.preference.findFirst({
            where: and(eq(preference.userId, userId), eq(preference.isActive, true)),
        });
    },

    async upsertUserPreference(userId: string, data: {
        properties: string[];
        frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month';
    }) {
        const existingPreference = await db.query.preference.findFirst({
            where: eq(preference.userId, userId),
        });

        if (existingPreference) {
            return await db
                .update(preference)
                .set({
                    ...data,
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(preference.userId, userId));
        } else {
            return await db
                .insert(preference)
                .values({
                    id: crypto.randomUUID(),
                    userId,
                    ...data,
                    isActive: true,
                });
        }
    },

    async softDeletePreference(userId: string) {
        return await db
            .update(preference)
            .set({ 
                isActive: false, 
                updatedAt: new Date() 
            })
            .where(eq(preference.userId, userId));
    },
};