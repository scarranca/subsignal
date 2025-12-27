import { db } from '@/db';
import { integration, emailSync, calendarSync } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { GOOGLE_CRM_SCOPES } from '@/lib/auth';

/**
 * Google API base URLs
 */
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';
const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

/**
 * Gmail message format
 */
interface GmailMessage {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
        headers: { name: string; value: string }[];
        body?: { data?: string };
        parts?: { mimeType: string; body?: { data?: string } }[];
    };
    internalDate: string;
}

/**
 * Calendar event format
 */
interface CalendarEvent {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: { email: string; displayName?: string; responseStatus?: string }[];
    organizer?: { email: string; displayName?: string };
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { uri: string; entryPointType: string }[] };
    status?: string;
    etag?: string;
    updated?: string;
}

export class GoogleService {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID!;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        this.redirectUri = `${process.env.BETTER_AUTH_URL}/api/v1/integrations/google/callback`;
    }

    /**
     * Generate OAuth URL for connecting Gmail/Calendar
     */
    getAuthUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: GOOGLE_CRM_SCOPES.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state,
        });

        return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
        email: string;
        name: string;
    }> {
        const response = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for tokens');
        }

        const data = await response.json();
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        // Get user info
        const userInfo = await this.getUserInfo(data.access_token);

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt,
            email: userInfo.email,
            name: userInfo.name,
        };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresAt: Date;
    }> {
        const response = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh access token');
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
        };
    }

    /**
     * Get user info from Google
     */
    async getUserInfo(accessToken: string): Promise<{ email: string; name: string }> {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        return response.json();
    }

    /**
     * Get valid access token (refresh if needed)
     */
    async getValidAccessToken(integrationId: string): Promise<string> {
        const [record] = await db
            .select()
            .from(integration)
            .where(eq(integration.id, integrationId));

        if (!record || !record.accessToken || !record.refreshToken) {
            throw new Error('Integration not found or tokens missing');
        }

        // Check if token is expired (with 5 min buffer)
        const isExpired = record.tokenExpiresAt && new Date(record.tokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000);

        if (isExpired) {
            const { accessToken, expiresAt } = await this.refreshAccessToken(record.refreshToken);

            await db
                .update(integration)
                .set({
                    accessToken,
                    tokenExpiresAt: expiresAt,
                    updatedAt: new Date(),
                })
                .where(eq(integration.id, integrationId));

            return accessToken;
        }

        return record.accessToken;
    }

    /**
     * Fetch Gmail messages
     */
    async fetchGmailMessages(
        accessToken: string,
        options: {
            maxResults?: number;
            pageToken?: string;
            query?: string;
            after?: Date;
        } = {}
    ): Promise<{
        messages: GmailMessage[];
        nextPageToken?: string;
    }> {
        const params = new URLSearchParams({
            maxResults: (options.maxResults || 50).toString(),
        });

        if (options.pageToken) params.set('pageToken', options.pageToken);

        // Build query
        let query = options.query || '';
        if (options.after) {
            const afterDate = Math.floor(options.after.getTime() / 1000);
            query += ` after:${afterDate}`;
        }
        if (query.trim()) params.set('q', query.trim());

        const listResponse = await fetch(
            `${GMAIL_API_URL}/users/me/messages?${params.toString()}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!listResponse.ok) {
            throw new Error('Failed to fetch Gmail messages');
        }

        const listData = await listResponse.json();

        if (!listData.messages?.length) {
            return { messages: [] };
        }

        // Fetch full message details
        const messages = await Promise.all(
            listData.messages.slice(0, 20).map(async (msg: { id: string }) => {
                const msgResponse = await fetch(
                    `${GMAIL_API_URL}/users/me/messages/${msg.id}?format=full`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                return msgResponse.json();
            })
        );

        return {
            messages,
            nextPageToken: listData.nextPageToken,
        };
    }

    /**
     * Get Gmail history (for incremental sync)
     */
    async getGmailHistory(
        accessToken: string,
        historyId: string,
        options: { maxResults?: number; pageToken?: string } = {}
    ): Promise<{
        history: any[];
        historyId: string;
        nextPageToken?: string;
    }> {
        const params = new URLSearchParams({
            startHistoryId: historyId,
            maxResults: (options.maxResults || 100).toString(),
        });

        if (options.pageToken) params.set('pageToken', options.pageToken);

        const response = await fetch(
            `${GMAIL_API_URL}/users/me/history?${params.toString()}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch Gmail history');
        }

        const data = await response.json();
        return {
            history: data.history || [],
            historyId: data.historyId,
            nextPageToken: data.nextPageToken,
        };
    }

    /**
     * Get Gmail profile (includes historyId)
     */
    async getGmailProfile(accessToken: string): Promise<{ emailAddress: string; historyId: string }> {
        const response = await fetch(
            `${GMAIL_API_URL}/users/me/profile`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch Gmail profile');
        }

        return response.json();
    }

    /**
     * Send email via Gmail
     */
    async sendEmail(
        accessToken: string,
        options: {
            to: string;
            subject: string;
            body: string;
            cc?: string;
            bcc?: string;
            threadId?: string;
        }
    ): Promise<{ id: string; threadId: string }> {
        const emailLines = [
            `To: ${options.to}`,
            options.cc ? `Cc: ${options.cc}` : '',
            options.bcc ? `Bcc: ${options.bcc}` : '',
            `Subject: ${options.subject}`,
            'Content-Type: text/html; charset=utf-8',
            '',
            options.body,
        ].filter(Boolean);

        const rawMessage = Buffer.from(emailLines.join('\r\n')).toString('base64url');

        const body: any = { raw: rawMessage };
        if (options.threadId) body.threadId = options.threadId;

        const response = await fetch(
            `${GMAIL_API_URL}/users/me/messages/send`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to send email');
        }

        return response.json();
    }

    /**
     * Fetch Calendar events
     */
    async fetchCalendarEvents(
        accessToken: string,
        options: {
            calendarId?: string;
            maxResults?: number;
            pageToken?: string;
            timeMin?: Date;
            timeMax?: Date;
            syncToken?: string;
        } = {}
    ): Promise<{
        events: CalendarEvent[];
        nextPageToken?: string;
        nextSyncToken?: string;
    }> {
        const calendarId = options.calendarId || 'primary';
        const params = new URLSearchParams({
            maxResults: (options.maxResults || 100).toString(),
            singleEvents: 'true',
            orderBy: 'startTime',
        });

        if (options.pageToken) params.set('pageToken', options.pageToken);
        if (options.syncToken) {
            params.set('syncToken', options.syncToken);
        } else {
            if (options.timeMin) params.set('timeMin', options.timeMin.toISOString());
            if (options.timeMax) params.set('timeMax', options.timeMax.toISOString());
        }

        const response = await fetch(
            `${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch calendar events');
        }

        const data = await response.json();
        return {
            events: data.items || [],
            nextPageToken: data.nextPageToken,
            nextSyncToken: data.nextSyncToken,
        };
    }

    /**
     * Create calendar event
     */
    async createCalendarEvent(
        accessToken: string,
        event: {
            summary: string;
            description?: string;
            location?: string;
            start: { dateTime: string; timeZone?: string };
            end: { dateTime: string; timeZone?: string };
            attendees?: { email: string }[];
            conferenceDataVersion?: number;
        },
        calendarId: string = 'primary'
    ): Promise<CalendarEvent> {
        const params = event.conferenceDataVersion
            ? `?conferenceDataVersion=${event.conferenceDataVersion}`
            : '';

        const response = await fetch(
            `${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events${params}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to create calendar event');
        }

        return response.json();
    }

    /**
     * Parse email headers
     */
    parseEmailHeaders(headers: { name: string; value: string }[]): {
        from: { email: string; name?: string };
        to: string[];
        cc: string[];
        subject: string;
        date: Date;
    } {
        const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const parseAddress = (addr: string) => {
            const match = addr.match(/(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?/);
            if (match) {
                return { name: match[1]?.trim(), email: match[2].trim() };
            }
            return { email: addr.trim() };
        };

        const parseAddressList = (list: string): string[] => {
            return list.split(',').map(a => parseAddress(a).email).filter(Boolean);
        };

        return {
            from: parseAddress(getHeader('From')) as { email: string; name?: string },
            to: parseAddressList(getHeader('To')),
            cc: parseAddressList(getHeader('Cc')),
            subject: getHeader('Subject'),
            date: new Date(getHeader('Date')),
        };
    }

    /**
     * Decode base64url encoded email body
     */
    decodeEmailBody(encoded?: string): string {
        if (!encoded) return '';
        try {
            return Buffer.from(encoded, 'base64url').toString('utf-8');
        } catch {
            return '';
        }
    }

    /**
     * Extract email body from message
     */
    extractEmailBody(message: GmailMessage): { text: string; html: string } {
        let text = '';
        let html = '';

        if (message.payload.body?.data) {
            text = this.decodeEmailBody(message.payload.body.data);
        }

        if (message.payload.parts) {
            for (const part of message.payload.parts) {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    text = this.decodeEmailBody(part.body.data);
                } else if (part.mimeType === 'text/html' && part.body?.data) {
                    html = this.decodeEmailBody(part.body.data);
                }
            }
        }

        return { text, html };
    }
}

// Singleton instance
export const googleService = new GoogleService();
