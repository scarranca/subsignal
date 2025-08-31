import { LiveScreenshotResult, ScreenshotOptions } from '@/types/screenshot';
import { NonRetriableError, RetryAfterError } from 'inngest';

export class LiveScreenshotService {
    // Singleton instance
    private static instance: LiveScreenshotService;

    // apiKey refers to the API key for the screenshot service.
    private apiKey: string;
    // apiOrigin refers to the origin of the screenshot service.
    private apiOrigin: string;

    private constructor() {
        this.apiKey = process.env.SCREENSHOT_API_KEY!;
        this.apiOrigin = process.env.SCREENSHOT_API_ORIGIN!;
    }

    /**
     * Get the singleton instance of LiveScreenshotService
     */
    public static getInstance(): LiveScreenshotService {
        if (!LiveScreenshotService.instance) {
            LiveScreenshotService.instance = new LiveScreenshotService();
        }
        return LiveScreenshotService.instance;
    }

    /**
     * Take a screenshot of a URL
     * @param url - The URL to screenshot
     * @param options - Screenshot options
     * @returns Promise<LiveScreenshotResult>
     */
    async takeScreenshot(
        url: string,
        options?: Omit<ScreenshotOptions, 'url'>,
        context?: any,
    ): Promise<LiveScreenshotResult> {
        const startTime = performance.now();

        try {
            const screenshotOptions: ScreenshotOptions = {
                // Inject the URL
                url,
                // Default options
                format: 'png',
                fullPage: true,
                blockAds: true,
                blockCookieBanners: true,
                blockTrackers: true,
                metadataContent: true,
                waitUntil: ['networkidle2'],
                cache: true,
                cacheTtl: 12 * 60 * 60, // 12 hours
                // Override default options with provided options
                ...options,
            };

            const screenshotUrl = this.createScreenshotUrl(screenshotOptions);

            if (context?.timing) {
                context.timing.start('screenshot-api-call', 'External screenshot API call');
            }

            const response = await fetch(screenshotUrl);

            if (context?.timing) {
                context.timing.end('screenshot-api-call');
            }

            if (!response.ok) {
                const errorText = await response.text();

                // Handle by HTTP status code first (faster and more reliable)
                switch (response.status) {
                    // 4xx - Client errors (non-retriable)
                    case 400: // Bad Request - invalid parameters/options
                    case 401: // Unauthorized - auth issues
                    case 403: // Forbidden - access denied, invalid key
                    case 404: // Not Found - invalid endpoint
                    case 413: // Payload Too Large
                    case 422: // Unprocessable Entity - invalid request format
                        throw new NonRetriableError(
                            `Client error (${response.status}): ${errorText}`,
                        );

                    // 429 - Rate limiting (retriable with delay)
                    case 429: {
                        // Check for Retry-After header
                        const retryAfter = response.headers.get('Retry-After');
                        if (retryAfter) {
                            // If seconds number, convert to duration string
                            const retryDelay = /^\d+$/.test(retryAfter)
                                ? `${retryAfter}s`
                                : retryAfter;
                            throw new RetryAfterError(`Rate limited: ${errorText}`, retryDelay);
                        }
                        // Fallback if no Retry-After header
                        throw new RetryAfterError(`Rate limited: ${errorText}`, '60s');
                    }

                    // 5xx - Server errors (retriable)
                    case 500: // Internal Server Error
                    case 502: // Bad Gateway
                    case 503: // Service Unavailable
                    case 504: // Gateway Timeout
                        throw new Error(`Server error (${response.status}): ${errorText}`);

                    default:
                        // Unknown status - retry with default backoff
                        throw new Error(`Screenshot failed (${response.status}): ${errorText}`);
                }
            }

            if (context?.timing) {
                context.timing.start(
                    'screenshot-data-processing',
                    'Process screenshot response data',
                );
            }

            // Get screenshot image data
            const imageData = await response.arrayBuffer();

            if (context?.timing) {
                context.timing.end('screenshot-data-processing');
            }
            const screenshot = Buffer.from(imageData);

            // Get content URL for HTML
            const contentUrl = response.headers.get('X-ScreenshotOne-Content-URL');

            if (!contentUrl) {
                throw new NonRetriableError('No content URL provided by screenshot service');
            }

            // Get HTML content
            const contentResponse = await fetch(contentUrl);
            if (!contentResponse.ok) {
                const contentErrorText = await contentResponse.text();

                // Handle content fetch errors by status code
                switch (contentResponse.status) {
                    // 4xx - Client errors (non-retriable)
                    case 400:
                    case 401:
                    case 403:
                    case 404:
                    case 413:
                    case 422:
                        throw new NonRetriableError(
                            `Content fetch client error (${contentResponse.status}): ${contentErrorText}`,
                        );

                    // 429 - Rate limiting (retriable with delay)
                    case 429: {
                        const retryAfter = contentResponse.headers.get('Retry-After');
                        if (retryAfter) {
                            const retryDelay = /^\d+$/.test(retryAfter)
                                ? `${retryAfter}s`
                                : retryAfter;
                            throw new RetryAfterError(
                                `Content fetch rate limited: ${contentErrorText}`,
                                retryDelay,
                            );
                        }
                        throw new RetryAfterError(
                            `Content fetch rate limited: ${contentErrorText}`,
                            '60s',
                        );
                    }

                    // 5xx - Server errors (retriable)
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        throw new Error(
                            `Content fetch server error (${contentResponse.status}): ${contentErrorText}`,
                        );

                    default:
                        throw new Error(
                            `Content fetch failed (${contentResponse.status}): ${contentErrorText}`,
                        );
                }
            }

            const html = await contentResponse.text();

            return {
                htmlContent: html,
                imageContent: screenshot,
            };
        } catch (error) {
            const duration = performance.now() - startTime;
            if (context?.timing) {
                context.timing.addEntry(
                    'screenshot-service-error',
                    duration,
                    'Screenshot service failed',
                );
            }
            throw error;
        }
    }

    // createScreenshotUrl creates a screenshot URL based on the options.
    private createScreenshotUrl(options: ScreenshotOptions): string {
        const params = new URLSearchParams();

        // Helper to add params, handling arrays correctly
        const addParam = (key: string, value: any) => {
            if (value === undefined || value === null) {
                return;
            }

            // Handle boolean values
            if (typeof value === 'boolean') {
                params.append(key, value.toString());
                return;
            }

            // Handle arrays (multi-select parameters)
            if (Array.isArray(value)) {
                value.forEach((v) => params.append(key, v.toString()));
                return;
            }

            // Handle regular values
            params.append(key, value.toString());
        };

        // Essential parameters
        addParam('access_key', this.apiKey);
        addParam('url', options.url);
        addParam('format', options.format);
        addParam('response_type', 'by_format');

        // Blocking options
        addParam('block_ads', options.blockAds);
        addParam('block_cookie_banners', options.blockCookieBanners);
        addParam('block_banners_by_heuristics', options.blockBannersByHeuristics);
        addParam('block_trackers', options.blockTrackers);
        addParam('block_chats', options.blockChats);

        // Resource blocking
        if (options.blockResources) {
            options.blockResources.forEach((resource) => {
                addParam('block_resources', resource);
            });
        }

        // Timing options
        addParam('delay', options.delay);
        addParam('timeout', options.timeout);
        addParam('navigation_timeout', options.navigationTimeout);

        // Wait until options (multiple allowed)
        options.waitUntil?.forEach((wait) => {
            params.append('wait_until', wait);
        });

        // Script wait until options (multiple allowed)
        options.scriptWaitUntil?.forEach((wait) => {
            params.append('scripts_wait_until', wait);
        });

        // Selector options
        addParam('wait_for_selector', options.waitForSelector);
        addParam('wait_for_selector_algorithm', options.waitForSelectorAlgorithm);

        // Mode options
        addParam('dark_mode', options.darkMode);
        addParam('reduced_motion', options.reducedMotion);

        // Metadata options
        addParam('metadata_image_size', options.metadataImageSize);
        addParam('metadata_page_title', options.metadataPageTitle);
        addParam('metadata_content', options.metadataContent);
        addParam('metadata_http_response_status_code', options.metadataHttpStatusCode);
        addParam('metadata_http_response_status_headers', options.metadataHttpHeaders);

        // Capture options
        addParam('capture_beyond_viewport', options.captureBeyondViewport);
        addParam('full_page', options.fullPage);
        addParam('full_page_scroll', options.fullPageScroll);
        addParam('full_page_algorithm', options.fullPageAlgorithm || 'default');
        addParam('image_quality', options.imageQuality);

        // Additional options if provided
        if (options.selector) addParam('selector', options.selector);
        if (options.scrollIntoView) addParam('scroll_into_view', options.scrollIntoView);
        if (options.hideSelectors?.length) {
            options.hideSelectors.forEach((selector) => {
                addParam('hide_selector', selector);
            });
        }
        if (options.blockRequests?.length) {
            options.blockRequests.forEach((pattern) => {
                addParam('block_request', pattern);
            });
        }

        return `${this.apiOrigin}/take?${params.toString()}`;
    }
}
