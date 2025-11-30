/**
 * Query Parser Utility
 * Parses and validates query parameters for advanced filtering
 */

import type { QueryFilter, QueryOptions } from "../types/api-response.ts";

/**
 * Parse filter query parameters
 * Supports formats like: filter[price][gt]=100
 */
export function parseFilters(queryParams: Record<string, string>): QueryFilter[] {
    const filters: QueryFilter[] = [];
    const filterRegex = /^filter\[([^\]]+)\]\[([^\]]+)\]$/;

    for (const [key, value] of Object.entries(queryParams)) {
        const match = key.match(filterRegex);
        if (match) {
            const [, field, operator] = match;

            // Validate operator
            const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'in', 'nin'];
            if (!validOperators.includes(operator)) {
                continue;
            }

            // Parse value (handle arrays for 'in' and 'nin')
            let parsedValue: any = value;
            if (operator === 'in' || operator === 'nin') {
                parsedValue = value.split(',');
            }

            filters.push({
                field,
                operator: operator as QueryFilter['operator'],
                value: parsedValue,
            });
        }
    }

    return filters;
}

/**
 * Parse sort query parameters
 * Supports format: sort=-created_at,title (- prefix for desc)
 */
export function parseSort(sortParam?: string) {
    if (!sortParam) return [];

    return sortParam.split(',').map(field => {
        const direction = field.startsWith('-') ? 'desc' : 'asc';
        const fieldName = field.startsWith('-') ? field.slice(1) : field;

        return {
            field: fieldName,
            direction,
        };
    });
}

/**
 * Parse fields selection
 * Supports format: fields=id,title,author
 */
export function parseFields(fieldsParam?: string): string[] | undefined {
    if (!fieldsParam) return undefined;
    return fieldsParam.split(',').map(f => f.trim());
}

/**
 * Parse expand/include relations
 * Supports format: expand=author,categories
 */
export function parseExpand(expandParam?: string): string[] | undefined {
    if (!expandParam) return undefined;
    return expandParam.split(',').map(e => e.trim());
}

/**
 * Parse pagination parameters
 */
export function parsePagination(pageParam?: string, limitParam?: string) {
    const page = Math.max(1, parseInt(pageParam || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '20')));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Parse all query options from request
 */
export function parseQueryOptions(queryParams: Record<string, string>): QueryOptions {
    return {
        filters: parseFilters(queryParams),
        sort: parseSort(queryParams.sort),
        fields: parseFields(queryParams.fields),
        expand: parseExpand(queryParams.expand),
        page: parseInt(queryParams.page || '1'),
        limit: Math.min(100, parseInt(queryParams.limit || '20')),
    };
}

/**
 * Validate field names against allowed fields
 */
export function validateFields(fields: string[], allowedFields: string[]): boolean {
    return fields.every(field => allowedFields.includes(field));
}

/**
 * Sanitize field name to prevent SQL injection
 */
export function sanitizeFieldName(field: string): string {
    // Only allow alphanumeric and underscore
    return field.replace(/[^a-zA-Z0-9_]/g, '');
}
// @ts-nocheck
