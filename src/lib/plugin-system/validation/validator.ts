import { z } from 'zod';

/**
 * Validator utility for plugin data validation and sanitization
 */
export class Validator {
    /**
     * Validate data against a Zod schema
     * @throws Error if validation fails
     */
    static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
        const result = schema.safeParse(data);
        if (!result.success) {
            const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new Error(`Validation failed: ${errors}`);
        }
        return result.data;
    }

    /**
     * Sanitize output data by removing internal fields and sensitive information
     */
    static sanitizeOutput(data: any): any {
        if (data === null || data === undefined) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeOutput(item));
        }

        if (data && typeof data === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(data)) {
                // Remove internal fields (starting with _)
                // Remove password fields
                // Remove token fields
                if (
                    !key.startsWith('_') &&
                    !key.toLowerCase().includes('password') &&
                    !key.toLowerCase().includes('token') &&
                    !key.toLowerCase().includes('secret')
                ) {
                    sanitized[key] = this.sanitizeOutput(value);
                }
            }
            return sanitized;
        }

        return data;
    }

    /**
     * Validate and sanitize field names for SQL queries
     */
    static validateFieldName(field: string): boolean {
        return /^[a-zA-Z0-9_]+$/.test(field);
    }

    /**
     * Escape special characters in values to prevent SQL injection
     */
    static escapeValue(value: any): any {
        if (typeof value === 'string') {
            // Use parameterized queries instead of escaping
            // This is just a safety layer
            return value.replace(/['";\\]/g, '');
        }
        return value;
    }

    /**
     * Validate that conditions object only contains safe field names
     */
    static validateConditions(conditions: Record<string, any>): void {
        for (const key of Object.keys(conditions)) {
            if (!this.validateFieldName(key)) {
                throw new Error(`Invalid field name in conditions: ${key}`);
            }
        }
    }

    /**
     * Validate that data object only contains safe field names
     */
    static validateData(data: Record<string, any>): void {
        for (const key of Object.keys(data)) {
            if (!this.validateFieldName(key)) {
                throw new Error(`Invalid field name in data: ${key}`);
            }
        }
    }
}
