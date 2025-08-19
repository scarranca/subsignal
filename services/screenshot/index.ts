import { LiveScreenshotService } from './live';
import { ArchiveScreenshotService } from './archive';
import {
    LiveScreenshotResult,
    ArchiveScreenshotResult,
    ScreenshotOptions,
} from '@/types/screenshot';

/**
 * ScreenshotService - provides a unified interface for screenshot services
 * Implements the facade pattern to simplify interaction with different screenshot providers
 */
export class ScreenshotService {
    private static instance: ScreenshotService;
    private liveService: LiveScreenshotService;
    private archiveService: ArchiveScreenshotService;

    private constructor() {
        this.liveService = LiveScreenshotService.getInstance();
        this.archiveService = ArchiveScreenshotService.getInstance();
    }

    /**
     * Get the singleton instance of ScreenshotService
     */
    public static getInstance(): ScreenshotService {
        if (!ScreenshotService.instance) {
            ScreenshotService.instance = new ScreenshotService();
        }
        return ScreenshotService.instance;
    }

    /**
     * Take a live screenshot of a URL
     * @param url - The URL to screenshot
     * @param options - Screenshot options
     * @returns Promise<LiveScreenshotResult>
     */
    async takeLiveScreenshot(
        url: string,
        options?: Omit<ScreenshotOptions, 'url'>,
    ): Promise<LiveScreenshotResult> {
        return this.liveService.takeScreenshot(url, options);
    }

    /**
     * Take a screenshot from archive content
     * @param url - The URL to get archive content for
     * @returns Promise<ArchiveScreenshotResult>
     */
    async takeArchiveScreenshot(url: string): Promise<ArchiveScreenshotResult> {
        return this.archiveService.takeScreenshot(url);
    }
}

// Export the facade instance for easy access
export const screenshotService = ScreenshotService.getInstance();
