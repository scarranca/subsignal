/**
 * URL utilities for extracting domain names and fetching page titles
 */

/**
 * Extract and capitalize domain name from URL
 * @param url - The URL to extract domain from
 * @returns Capitalized domain name
 */
export function extractCompanyName(url: string): string {
    try {
        const domain = new URL(url).hostname;
        // Remove www. prefix if present
        const cleanDomain = domain.replace(/^www\./, '');
        // Extract the main part (before first dot)
        const mainPart = cleanDomain.split('.')[0];
        // Capitalize first letter
        return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    } catch {
        return 'Unknown Company';
    }
}

/**
 * Extract base URL (protocol + hostname) from a full URL
 * @param url - The full URL
 * @returns Base URL
 */
export function extractBaseUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
        return url;
    }
}

/**
 * Fetch page title from URL
 * @param url - The URL to fetch title from
 * @returns Promise<string> - The page title or fallback
 */
export async function fetchPageTitle(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Subsignal Bot/1.0',
            },
            // Add timeout
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extract title from HTML
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

        if (titleMatch && titleMatch[1]) {
            // Clean up the title (remove extra whitespace, decode HTML entities)
            return titleMatch[1].trim().replace(/\s+/g, ' ');
        }

        // Fallback to URL path or domain
        const urlObj = new URL(url);
        if (urlObj.pathname && urlObj.pathname !== '/') {
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const lastPart = pathParts[pathParts.length - 1];
            // Capitalize and replace hyphens/underscores with spaces
            return lastPart.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }

        return 'Home';
    } catch (error) {
        console.error(`Failed to fetch title for ${url}:`, error);

        // Fallback: try to generate title from URL path
        try {
            const urlObj = new URL(url);
            if (urlObj.pathname && urlObj.pathname !== '/') {
                const pathParts = urlObj.pathname.split('/').filter(Boolean);
                const lastPart = pathParts[pathParts.length - 1];
                return lastPart.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            }
        } catch {
            // If URL parsing fails, return default
        }

        return 'Home';
    }
}
