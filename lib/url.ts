/**
 * URL utilities for extracting domain names and fetching page titles
 */

import { extractCompanyNameAI, generateTitleAI } from './ai';

/**
 * Normalize URL by adding protocol if missing and cleaning up
 * @param url - The URL to normalize
 * @returns Normalized URL with protocol
 */
export function normalizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    const trimmed = url.trim();
    if (!trimmed) return '';

    // If URL already has a protocol, return as is
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    // Add https:// prefix by default
    return `https://${trimmed}`;
}

/**
 * Check if a URL is a non-useful/local URL that should be rejected
 * @param url - The URL to check
 * @returns True if the URL should be rejected
 */
function isInvalidUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // Reject localhost variations
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '::1' ||
            hostname.startsWith('localhost.') ||
            hostname.endsWith('.localhost')
        ) {
            return true;
        }

        // Reject private IP ranges
        if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)) {
            return true;
        }

        // Reject IP addresses that look like local/internal
        if (/^(0\.|169\.254\.|224\.|239\.|255\.)/.test(hostname)) {
            return true;
        }

        // Reject file:// protocol
        if (urlObj.protocol === 'file:') {
            return true;
        }

        // Reject URLs without proper domains (must have at least one dot or be a known TLD)
        if (
            !hostname.includes('.') &&
            !['com', 'org', 'net', 'edu', 'gov', 'mil'].includes(hostname)
        ) {
            return true;
        }

        return false;
    } catch {
        return true; // If we can't parse it, reject it
    }
}

/**
 * Validate if a string can be converted to a valid, useful URL
 * @param url - The URL string to validate
 * @returns True if valid and useful URL (after normalization)
 */
export function isValidUrl(url: string): boolean {
    try {
        const normalized = normalizeUrl(url);
        if (!normalized) return false;

        // Check if it's a valid URL structure
        const urlObj = new URL(normalized);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;
        }

        // Check if it's a non-useful URL
        if (isInvalidUrl(normalized)) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Extract and capitalize domain name from URL (basic fallback)
 * @param url - The URL to extract domain from
 * @returns Capitalized domain name
 */
export function extractCompanyNameBasic(url: string): string {
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
 * Extract company name with AI enhancement, falling back to basic method
 * @param url - The URL to extract domain from
 * @returns Promise<string> - Capitalized domain name
 */
export async function extractCompanyName(url: string): Promise<string> {
    try {
        return await extractCompanyNameAI(url);
    } catch {
        return extractCompanyNameBasic(url);
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
 * Generate a fallback title from URL path (basic fallback)
 * @param url - The URL to generate title from
 * @returns Fallback title based on URL path
 */
export function generateFallbackTitleBasic(url: string): string {
    try {
        const urlObj = new URL(url);
        if (urlObj.pathname && urlObj.pathname !== '/') {
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const lastPart = pathParts[pathParts.length - 1];
            // Capitalize and replace hyphens/underscores with spaces
            return lastPart.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }
        return 'Home';
    } catch {
        // If URL parsing fails, return default
        return 'Home';
    }
}

/**
 * Generate fallback title with AI enhancement, falling back to basic method
 * @param url - The URL to generate title from
 * @returns Promise<string> - Fallback title based on URL path
 */
export async function generateFallbackTitle(url: string): Promise<string> {
    try {
        return await generateTitleAI(url);
    } catch {
        return generateFallbackTitleBasic(url);
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
                'User-Agent': 'Mozilla/5.0 (compatible; Subsignal/1.0)',
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
        return generateFallbackTitle(url);
    } catch (error) {
        console.error(`Failed to fetch title for ${url}:`, error);
        // Use fallback title generation
        return generateFallbackTitle(url);
    }
}
