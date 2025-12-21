/**
 * Error Handling Utilities for LexSlider
 */

/**
 * Base Plugin Error class
 */
export class PluginError extends Error {
    public readonly status: number;
    public readonly code: string;

    constructor(message: string, status = 500, code = 'PLUGIN_ERROR') {
        super(message);
        this.name = 'PluginError';
        this.status = status;
        this.code = code;
    }
}

/**
 * Resource not found error
 */
export class NotFoundError extends PluginError {
    constructor(resource: string, id?: string | number) {
        super(
            id ? `${resource} with ID ${id} not found` : `${resource} not found`,
            404,
            'NOT_FOUND'
        );
        this.name = 'NotFoundError';
    }
}

/**
 * Validation error (re-exported from validation.ts for convenience)
 */
export { ValidationError } from './validation.ts';

/**
 * Permission/Authorization error
 */
export class PermissionError extends PluginError {
    constructor(message = 'Permission denied') {
        super(message, 403, 'PERMISSION_DENIED');
        this.name = 'PermissionError';
    }
}

/**
 * Database error
 */
export class DatabaseError extends PluginError {
    constructor(message = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
    }
}

/**
 * Handle error and return appropriate response object
 */
export function handleError(error: unknown): { error: string; status: number; code?: string } {
    if (error instanceof PluginError) {
        return {
            error: error.message,
            status: error.status,
            code: error.code,
        };
    }

    if (error instanceof Error) {
        // Log unexpected errors
        console.error('[LexSlider] Unexpected error:', error);
        return {
            error: error.message,
            status: 500,
            code: 'INTERNAL_ERROR',
        };
    }

    return {
        error: String(error),
        status: 500,
        code: 'UNKNOWN_ERROR',
    };
}

/**
 * Wrapper for route handlers with automatic error handling
 */
export function wrapHandler<T>(
    handler: (ctx: T) => Promise<unknown>
): (ctx: T) => Promise<unknown> {
    return async (ctx: T) => {
        try {
            return await handler(ctx);
        } catch (error) {
            const result = handleError(error);
            return { success: false, ...result };
        }
    };
}
