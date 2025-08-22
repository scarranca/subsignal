import { inngest } from '@/ingest/client';
import { GetStepTools } from 'inngest';

export class DurableBriefingService {
    private static instance: DurableBriefingService;

    private constructor() {}

    public static getInstance(): DurableBriefingService {
        if (!DurableBriefingService.instance) {
            DurableBriefingService.instance = new DurableBriefingService();
        }
        return DurableBriefingService.instance;
    }

    /**
     * Create briefing for multiple users
     * @param step - The step to send the briefing events to
     * @param userData - The list of users to create briefings for
     */
    async createBriefingForUsers(
        step: GetStepTools<typeof inngest>,
        userData: { userId: string; properties: string[] }[],
    ) {
        if (userData.length === 0) {
            return { briefingsSent: 0 };
        }

        // Create briefing events
        const briefingEvents = userData.map((user) => ({
            name: 'briefing/create.briefing',
            data: {
                userId: user.userId,
                properties: user.properties,
            },
        }));

        // Send events in batches of 10
        const BRIEFING_BATCH_SIZE = 10;
        const briefingBatches = [];
        for (let i = 0; i < briefingEvents.length; i += BRIEFING_BATCH_SIZE) {
            briefingBatches.push(briefingEvents.slice(i, i + BRIEFING_BATCH_SIZE));
        }

        for (let batchIndex = 0; batchIndex < briefingBatches.length; batchIndex++) {
            const batch = briefingBatches[batchIndex];
            await step.sendEvent('briefing/create.briefing', batch);
        }

        return { briefingsSent: briefingEvents.length };
    }
}

export const durableBriefingService = DurableBriefingService.getInstance();
