import { z } from 'zod';

export const screenshotOptionsSchema = z
    .object({
        // Selector Options
        selector: z.string().optional(),
        scrollIntoView: z.string().optional(),
        adjustTop: z.number().optional(),
        captureBeyondViewport: z.boolean().optional(),

        // Capture Options
        fullPage: z.boolean().optional(),
        fullPageScroll: z.boolean().optional(),
        fullPageAlgorithm: z.enum(['by_sections', 'default']).optional(),
        scrollDelay: z.number().optional(),
        scrollBy: z.number().optional(),
        maxHeight: z.number().optional(),
        format: z.enum(['jpg', 'png', 'webp']).optional(),
        imageQuality: z.number().min(0).max(100).optional(),
        omitBackground: z.boolean().optional(),

        // Clip Options
        clip: z
            .object({
                x: z.number().optional(),
                y: z.number().optional(),
                width: z.number().optional(),
                height: z.number().optional(),
            })
            .optional(),

        // Block Options
        blockAds: z.boolean().optional(),
        blockCookieBanners: z.boolean().optional(),
        blockBannersByHeuristics: z.boolean().optional(),
        blockTrackers: z.boolean().optional(),
        blockChats: z.boolean().optional(),
        blockRequests: z.array(z.string()).optional(),
        blockResources: z.array(z.string()).optional(),

        // Media Options
        darkMode: z.boolean().optional(),
        reducedMotion: z.boolean().optional(),

        // Request Options
        userAgent: z.string().optional(),
        authorization: z.string().optional(),
        headers: z.record(z.string()).optional(),
        cookies: z.array(z.string()).optional(),
        timezone: z.string().optional(),
        bypassCSP: z.boolean().optional(),
        ipCountryCode: z.string().optional(),

        // Wait and Delay Options
        delay: z.number().optional(),
        timeout: z.number().optional(),
        navigationTimeout: z.number().optional(),
        waitForSelector: z.string().optional(),
        waitForSelectorAlgorithm: z.enum(['at_least_one', 'at_least_by_count']).optional(),
        waitUntil: z
            .array(z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']))
            .optional(),

        // Interaction Options
        click: z.string().optional(),
        failIfClickNotFound: z.boolean().optional(),
        hideSelectors: z.array(z.string()).optional(),
        styles: z.string().optional(),
        scripts: z.string().optional(),
        scriptWaitUntil: z
            .array(z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']))
            .optional(),

        // Metadata Options
        metadataImageSize: z.boolean().optional(),
        metadataPageTitle: z.boolean().optional(),
        metadataContent: z.boolean().optional(),
        metadataHttpStatusCode: z.boolean().optional(),
        metadataHttpHeaders: z.boolean().optional(),

        // Caching Options
        cache: z.boolean().optional(),
        cacheTtl: z.number().optional(),
        cacheKey: z.string().optional(),
    })
    .optional();
