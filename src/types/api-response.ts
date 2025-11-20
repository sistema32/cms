/**
 * Standard API Response Types
 * Provides consistent response structure for all API endpoints
 */

export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
    meta?: {
        pagination?: PaginationMeta;
        timestamp?: string;
        [key: string]: any;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        field?: string; // For validation errors
    };
    meta?: {
        timestamp?: string;
        requestId?: string;
    };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface QueryFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
    value: any;
}

export interface QueryOptions {
    filters?: QueryFilter[];
    sort?: {
        field: string;
        direction: 'asc' | 'desc';
    }[];
    fields?: string[]; // Select specific fields
    expand?: string[]; // Include relations
    page?: number;
    limit?: number;
}
