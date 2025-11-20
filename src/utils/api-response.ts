/**
 * API Response Helpers
 * Utility functions for creating standardized API responses
 */

import type { Context } from "hono";
import type {
    ApiErrorResponse,
    ApiSuccessResponse,
    PaginationMeta,
} from "../types/api-response.ts";

/**
 * Send a successful API response
 */
export function successResponse<T>(
    c: Context,
    data: T,
    meta?: ApiSuccessResponse<T>["meta"],
    status = 200
) {
    const response: ApiSuccessResponse<T> = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };

    return c.json(response, status as any);
}

/**
 * Send an error API response
 */
export function errorResponse(
    c: Context,
    code: string,
    message: string,
    status = 400,
    details?: any,
    field?: string
) {
    const response: ApiErrorResponse = {
        success: false,
        error: {
            code,
            message,
            details,
            field,
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: c.req.header("x-request-id"),
        },
    };

    return c.json(response, status as any);
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

/**
 * Common error responses
 */
export const ErrorResponses = {
    notFound: (c: Context, resource: string = "Resource") =>
        errorResponse(c, "NOT_FOUND", `${resource} not found`, 404),

    unauthorized: (c: Context, message: string = "Unauthorized") =>
        errorResponse(c, "UNAUTHORIZED", message, 401),

    forbidden: (c: Context, message: string = "Forbidden") =>
        errorResponse(c, "FORBIDDEN", message, 403),

    badRequest: (c: Context, message: string, details?: any) =>
        errorResponse(c, "BAD_REQUEST", message, 400, details),

    validationError: (c: Context, field: string, message: string) =>
        errorResponse(c, "VALIDATION_ERROR", message, 422, undefined, field),

    internalError: (c: Context, message: string = "Internal server error") =>
        errorResponse(c, "INTERNAL_ERROR", message, 500),

    rateLimitExceeded: (c: Context) =>
        errorResponse(c, "RATE_LIMIT_EXCEEDED", "Too many requests", 429),
};
