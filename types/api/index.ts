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
    plan?: 'solo_plan' | 'team_plan' | 'enterprise_plan';
    subscriptionId?: string;
    status?: string;
    userName?: string;
    userEmail?: string;
}

export interface CreateNewSubscriptionRequest {
    planId: string;
}

export interface UpdateSubscriptionRequest {
    planId: string;
}

export interface UpdateSubscriptionResponse {
    subscriptionId: string;
}

export interface CreateNewSubscriptionResponse {
    checkoutUrl: string;
    sessionId: string;
}

export interface ValidatePaymentStatusResponse {
    isValid: boolean;
}

export interface ValidatePaymentStatusRequest {
    subscription_id: string;
}
