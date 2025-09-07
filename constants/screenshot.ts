import { ScreenshotOptions } from '@/types/screenshot';

export const DEFAULT_PAGE_OPTIONS: Omit<ScreenshotOptions, 'url'> = {
    format: 'png',
    fullPage: true,
    blockAds: true,
    blockCookieBanners: true,
    blockTrackers: true,
    metadataContent: true,
    waitUntil: ['networkidle2'],
    cache: true,
    cacheTtl: 12 * 60 * 60, // 12 hours
};
