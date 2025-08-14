export type PaginationOptions = {
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'title';
    sortOrder?: 'asc' | 'desc';
};

export type PaginatedResult<T> = {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
};