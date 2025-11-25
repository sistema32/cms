import { db, executeQuery } from '../../db/index.ts';
import { pluginRouteRegistry } from './PluginRouteRegistry.ts';
import { adminPanelRegistry } from './AdminPanelRegistry.ts';
import { hookManager } from './HookManager.ts';

export class HostAPI {
    private pluginName: string;

    constructor(pluginName: string) {
        this.pluginName = pluginName;
    }

    async query(sql: string, params: any[] = []) {
        // TODO: Add security validation (read-only check, table scoping)
        return await executeQuery(sql, params);
    }

    async fetch(url: string, options: any) {
        // TODO: Add SSRF protection
        return await fetch(url, options);
    }

    log(message: string, level: string) {
        console.log(`[Plugin:${this.pluginName}] [${level.toUpperCase()}] ${message}`);
    }

    registerRoute(method: string, path: string, handlerId: string) {
        pluginRouteRegistry.register(this.pluginName, method, path, handlerId);
    }

    registerAdminPanel(config: any) {
        adminPanelRegistry.register({
            ...config,
            pluginName: this.pluginName
        });
    }

    async handleDatabaseOperation(operation: string, collection: string, ...args: any[]) {
        const tableName = `${this.pluginName}_${collection}`;

        switch (operation) {
            case 'find': {
                const [query] = args;
                // Simple WHERE clause generation
                // This is a basic implementation. For complex queries, we need a proper builder.
                const conditions: string[] = [];
                const params: any[] = [];

                if (query) {
                    for (const [key, value] of Object.entries(query)) {
                        conditions.push(`${key} = ?`);
                        params.push(value);
                    }
                }

                const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
                const sql = `SELECT * FROM ${tableName} ${where}`;

                let result = await executeQuery(sql, params);
                if (result && !Array.isArray(result) && Array.isArray(result.rows)) {
                    result = result.rows;
                }
                return result || [];
            }
            case 'findOne': {
                const [query] = args;
                const conditions: string[] = [];
                const params: any[] = [];

                if (query) {
                    for (const [key, value] of Object.entries(query)) {
                        conditions.push(`${key} = ?`);
                        params.push(value);
                    }
                }

                const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
                const sql = `SELECT * FROM ${tableName} ${where} LIMIT 1`;

                let result = await executeQuery(sql, params);
                if (result && !Array.isArray(result) && Array.isArray(result.rows)) {
                    result = result.rows;
                }
                return result && result.length > 0 ? result[0] : null;
            }
            case 'create': {
                const [data] = args;
                const keys = Object.keys(data);
                const values = Object.values(data);
                const placeholders = keys.map(() => '?').join(', ');

                const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;

                // For MySQL/SQLite without RETURNING, we might need separate SELECT.
                // Assuming Postgres/LibSQL supports RETURNING or we handle it.
                // If executeQuery returns the inserted row (drizzle behavior depends on driver), great.

                let result = await executeQuery(sql, values);
                if (result && !Array.isArray(result) && Array.isArray(result.rows)) {
                    result = result.rows;
                }

                // If result is array, return first item.
                if (Array.isArray(result) && result.length > 0) return result[0];

                // Fallback if no RETURNING support (e.g. MySQL) - fetch by ID if possible or return data
                // For now, return data merged with ID if available
                return data;
            }
            case 'update': {
                const [query, data] = args;
                const setClauses: string[] = [];
                const params: any[] = [];

                for (const [key, value] of Object.entries(data)) {
                    setClauses.push(`${key} = ?`);
                    params.push(value);
                }

                const conditions: string[] = [];
                for (const [key, value] of Object.entries(query)) {
                    conditions.push(`${key} = ?`);
                    params.push(value);
                }

                const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
                const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} ${where}`;

                await executeQuery(sql, params);
                return { success: true }; // or return count
            }
            case 'delete': {
                const [query] = args;
                const conditions: string[] = [];
                const params: any[] = [];

                for (const [key, value] of Object.entries(query)) {
                    conditions.push(`${key} = ?`);
                    params.push(value);
                }

                const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
                const sql = `DELETE FROM ${tableName} ${where}`;

                await executeQuery(sql, params);
                return { success: true };
            }
            default:
                throw new Error(`Unknown database operation: ${operation}`);
        }
    }

    registerAction(hook: string, callbackId: string, priority: number) {
        hookManager.registerAction(hook, callbackId, priority, this.pluginName);
    }

    registerFilter(hook: string, callbackId: string, priority: number) {
        hookManager.registerFilter(hook, callbackId, priority, this.pluginName);
    }

    // Hooks would go here too, interacting with a HookManager
}
