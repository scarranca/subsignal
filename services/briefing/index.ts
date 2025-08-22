import { Briefing } from '@/types/briefing';

export class BriefingService {
    private static instance: BriefingService;

    private constructor() {}

    public static getInstance(): BriefingService {
        if (!BriefingService.instance) {
            BriefingService.instance = new BriefingService();
        }
        return BriefingService.instance;
    }

    async createBriefingForCompany(companyId: string, properties: string[]): Promise<Briefing> {
        console.log('Creating briefing for company', companyId);
        return {};
    }

    async getLatestBriefingForCompany(companyId: string): Promise<Briefing> {
        console.log('Getting latest briefing for company', companyId);
        return {};
    }
}

export const briefingService = BriefingService.getInstance();
