import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { Frequency, preference, Properties } from '../schema/preference';
import { user } from '../schema/auth';
import { billing } from '../schema/billing';

export const preferenceQueries = {
    async getUserPreference(userId: string) {
        return await db.query.preference.findFirst({
            where: and(eq(preference.userId, userId), eq(preference.isActive, true)),
        });
    },

    async upsertUserPreference(
        userId: string,
        data: {
            properties: Properties[];
            frequency: Frequency;
        },
    ) {
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
            return await db.insert(preference).values({
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
                updatedAt: new Date(),
            })
            .where(eq(preference.userId, userId));
    },

    async getUsersByFrequency(frequency: Frequency, excludeNonBillingUsers: boolean = true) {
        if (excludeNonBillingUsers) {
            return await db
                .select({
                    userId: user.id,
                    properties: preference.properties,
                    frequency: preference.frequency,
                })
                .from(preference)
                .innerJoin(user, eq(preference.userId, user.id))
                .innerJoin(billing, eq(user.id, billing.userId))
                .where(
                    and(
                        eq(preference.frequency, frequency),
                        eq(preference.isActive, true),
                        eq(billing.status, 'active'),
                    ),
                );
        } else {
            return await db
                .select({
                    userId: user.id,
                    properties: preference.properties,
                    frequency: preference.frequency,
                })
                .from(preference)
                .innerJoin(user, eq(preference.userId, user.id))
                .where(and(eq(preference.frequency, frequency), eq(preference.isActive, true)));
        }
    },

    async getPreferenceFrequencyByUser(userId: string) {
        return await db
            .select({
                frequency: preference.frequency,
            })
            .from(preference)
            .where(and(eq(preference.userId, userId), eq(preference.isActive, true)));
    },
};
