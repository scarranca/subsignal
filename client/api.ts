/**
 * API Client for making authenticated requests to Subsignal API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success?: boolean;
    details?: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'title';
    sortOrder?: 'asc' | 'desc';
}

// Type definitions based on our schemas
export interface Preference {
    id: string;
    userId: string;
    properties: ('pricing' | 'product' | 'customer' | 'partnership' | 'branding' | 'messaging')[];
    frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Company {
    id: string;
    userId: string;
    name: string;
    url: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    pages?: Page[];
}

export interface Page {
    id: string;
    companyId: string;
    title: string;
    url: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCompanyRequest {
    company: {
        name: string;
        url: string;
    };
    page: {
        title?: string; // Optional since we auto-fetch it on the server
        url: string;
    };
}

export interface BatchCreateCompaniesRequest {
    urls: string[];
}

export interface BatchCreateCompaniesResponse {
    success: boolean;
    results: Array<{
        url: string;
        success: true;
        company: Company;
        page: Page | null;
        skipped?: boolean;
    }>;
    errors: Array<{
        url: string;
        success: false;
        error: string;
    }>;
    summary: {
        total: number;
        successful: number;
        failed: number;
        created?: number;
        skipped?: number;
    };
}

export interface UpdateCompanyRequest {
    name?: string;
    url?: string;
}

export interface CreatePageRequest {
    page: {
        title?: string; // Optional since we auto-fetch it on the server
        url: string;
    };
    company: {
        id?: string; // For existing company
        name?: string; // For new company
        url?: string; // For new company
    };
}

export interface UpdatePageRequest {
    title?: string;
    url?: string;
}

export interface UpdatePreferenceRequest {
    properties: ('pricing' | 'product' | 'customer' | 'partnership' | 'branding' | 'messaging')[];
    frequency: '7_day' | '15_day' | '1_month' | '3_month' | '6_month';
}

export interface DeletePagesRequest {
    pageIds: string[];
}

export interface PaymentStatus {
    isPaying: boolean;
    currentPlan?: 'solo_plan' | 'team_plan';
    subscriptionId?: string;
    status?: string;
    userName?: string;
    userEmail?: string;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseURL}${endpoint}`;

            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                    details: errorData.details,
                    success: false,
                };
            }

            const data = await response.json();
            return {
                data,
                success: true,
            };
        } catch (error) {
            console.error(`[API_CLIENT] Network error:`, error);
            return {
                error: error instanceof Error ? error.message : 'Network error',
                success: false,
            };
        }
    }

    /**
     * Health API methods
     */

    /**
     * Check API health status
     * @returns Promise with health status data
     */
    async getHealth() {
        return this.request('/health');
    }

    /**
     * Check API readiness
     * @returns Promise with readiness status
     */
    async getHealthReadiness() {
        return this.request('/health/ready');
    }

    /**
     * Check API liveness
     * @returns Promise with liveness status
     */
    async getHealthLiveness() {
        return this.request('/health/live');
    }

    /**
     * Payments API methods
     */

    /**
     * Get user payment status
     * @returns Promise with payment status data including user info
     */
    async getPaymentStatus(): Promise<ApiResponse<PaymentStatus>> {
        return this.request<PaymentStatus>('/payments/status');
    }

    /**
     * Preferences API methods
     */

    /**
     * Get user preferences
     * @returns Promise with user preferences data
     */
    async getPreferences(): Promise<ApiResponse<Preference>> {
        return this.request<Preference>('/preferences');
    }

    /**
     * Create or update user preferences
     * @param data - Preference data with properties and frequency
     * @returns Promise with updated preferences
     */
    async upsertPreferences(data: UpdatePreferenceRequest): Promise<ApiResponse<Preference>> {
        return this.request<Preference>('/preferences', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update user preferences (PUT method)
     * @param data - Preference data with properties and frequency
     * @returns Promise with updated preferences
     */
    async updatePreferences(data: UpdatePreferenceRequest): Promise<ApiResponse<Preference>> {
        return this.request<Preference>('/preferences', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete user preferences
     * @returns Promise with deletion result
     */
    async deletePreferences(): Promise<ApiResponse<{ success: boolean }>> {
        return this.request<{ success: boolean }>('/preferences', {
            method: 'DELETE',
        });
    }

    /**
     * Companies API methods
     */

    /**
     * Get all companies with pagination
     * @param params - Optional pagination parameters
     * @returns Promise with paginated companies data
     */
    async getCompanies(
        params: PaginationParams = {},
        excludePages: boolean = false,
    ): Promise<ApiResponse<PaginatedResponse<Company>>> {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.set('page', params.page.toString());
        if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
        if (params.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
        if (excludePages) searchParams.set('excludePages', 'true');

        const queryString = searchParams.toString();
        const endpoint = queryString ? `/companies?${queryString}` : '/companies';

        return this.request<PaginatedResponse<Company>>(endpoint);
    }

    /**
     * Get a specific company by ID
     * @param companyId - The company ID to fetch
     * @returns Promise with company data
     */
    async getCompany(companyId: string): Promise<ApiResponse<Company>> {
        return this.request<Company>(`/companies/${companyId}`);
    }

    /**
     * Create a new company with initial page
     * @param data - Company and initial page data
     * @returns Promise with created company data
     */
    async createCompany(data: CreateCompanyRequest): Promise<ApiResponse<Company>> {
        return this.request<Company>('/companies', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update a company
     * @param companyId - The company ID to update
     * @param data - The update data (name, url)
     * @returns Promise with updated company data
     */
    async updateCompany(
        companyId: string,
        data: UpdateCompanyRequest,
    ): Promise<ApiResponse<Company>> {
        return this.request<Company>(`/companies/${companyId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a company and all its pages
     * @param companyId - The company ID to delete
     * @returns Promise with deletion result
     */
    async deleteCompany(companyId: string): Promise<ApiResponse<{ success: boolean }>> {
        return this.request<{ success: boolean }>(`/companies/${companyId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Batch create companies from URLs
     * @param data - Object containing array of URLs
     * @returns Promise with batch creation results
     */
    async batchCreateCompanies(
        data: BatchCreateCompaniesRequest,
    ): Promise<ApiResponse<BatchCreateCompaniesResponse>> {
        console.log('API Client - Sending batch create request:', data);
        const response = await this.request<BatchCreateCompaniesResponse>('/companies/batch', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        console.log('API Client - Batch create response:', response);
        return response;
    }

    /**
     * Pages API methods
     */

    /**
     * Get all pages for user with pagination
     * @param params - Optional pagination parameters
     * @returns Promise with paginated pages data
     */
    async getPages(params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Page>>> {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.set('page', params.page.toString());
        if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
        if (params.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

        const queryString = searchParams.toString();
        const endpoint = queryString ? `/pages?${queryString}` : '/pages';

        return this.request<PaginatedResponse<Page>>(endpoint);
    }

    /**
     * Get a specific page by ID
     * @param pageId - The page ID to fetch
     * @returns Promise with page data
     */
    async getPage(pageId: string): Promise<ApiResponse<Page>> {
        return this.request<Page>(`/pages/${pageId}`);
    }

    /**
     * Get pages by company with pagination
     * @param companyId - The company ID to fetch pages for
     * @param params - Optional pagination parameters
     * @returns Promise with paginated pages data for the company
     */
    async getPagesByCompany(
        companyId: string,
        params: PaginationParams = {},
    ): Promise<ApiResponse<PaginatedResponse<Page>>> {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.set('page', params.page.toString());
        if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
        if (params.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

        const queryString = searchParams.toString();
        const endpoint = queryString
            ? `/pages/company/${companyId}?${queryString}`
            : `/pages/company/${companyId}`;

        return this.request<PaginatedResponse<Page>>(endpoint);
    }

    /**
     * Create a new page (with existing or new company)
     * @param data - Page and company data
     * @returns Promise with created page data or page+company data
     */
    async createPage(
        data: CreatePageRequest,
    ): Promise<ApiResponse<Page | { page: Page; company: Company }>> {
        return this.request<Page | { page: Page; company: Company }>('/pages', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update a page
     * @param pageId - The page ID to update
     * @param data - The update data (title, url)
     * @returns Promise with updated page data
     */
    async updatePage(pageId: string, data: UpdatePageRequest): Promise<ApiResponse<Page>> {
        return this.request<Page>(`/pages/${pageId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete pages (supports single or multiple page IDs)
     * @param data - Object containing array of page IDs to delete
     * @returns Promise with deletion result
     */
    async deletePages(data: DeletePagesRequest): Promise<ApiResponse<any>> {
        return this.request('/pages', {
            method: 'DELETE',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a single page (convenience method)
     * @param pageId - The page ID to delete
     * @returns Promise with deletion result
     */
    async deletePage(pageId: string): Promise<ApiResponse<any>> {
        return this.deletePages({ pageIds: [pageId] });
    }
}

export const apiClient = new ApiClient();
export default apiClient;
