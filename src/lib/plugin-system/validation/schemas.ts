import { z } from 'zod';

/**
 * Schema for database query operations
 */
export const DatabaseQuerySchema = z.object({
    table: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Table name must contain only alphanumeric characters and underscores'),
    conditions: z.record(z.any()).optional(),
    limit: z.number().int().positive().max(1000).optional(),
    offset: z.number().int().nonnegative().optional(),
    orderBy: z.object({
        field: z.string().regex(/^[a-zA-Z0-9_]+$/),
        direction: z.enum(['ASC', 'DESC'])
    }).optional()
});

/**
 * Schema for database insert operations
 */
export const DatabaseInsertSchema = z.object({
    table: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Table name must contain only alphanumeric characters and underscores'),
    data: z.record(z.any()).refine(
        (data) => Object.keys(data).length > 0,
        { message: 'Insert data cannot be empty' }
    )
});

/**
 * Schema for database update operations
 */
export const DatabaseUpdateSchema = z.object({
    table: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Table name must contain only alphanumeric characters and underscores'),
    conditions: z.record(z.any()).refine(
        (cond) => Object.keys(cond).length > 0,
        { message: 'Update conditions cannot be empty' }
    ),
    data: z.record(z.any()).refine(
        (data) => Object.keys(data).length > 0,
        { message: 'Update data cannot be empty' }
    )
});

/**
 * Schema for database delete operations
 */
export const DatabaseDeleteSchema = z.object({
    table: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Table name must contain only alphanumeric characters and underscores'),
    conditions: z.record(z.any()).refine(
        (cond) => Object.keys(cond).length > 0,
        { message: 'Delete conditions cannot be empty to prevent accidental full table deletion' }
    )
});

/**
 * Validate field names to prevent SQL injection
 */
export function validateFieldName(field: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(field);
}

/**
 * Sanitize string values to prevent SQL injection
 */
export function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
        // Remove potentially dangerous SQL keywords and characters
        return value.replace(/['";\\]/g, '');
    }
    return value;
}
