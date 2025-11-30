
import { executeQuery } from "../db/index.ts";
import { DbRequest } from "./pluginRpc.ts";

/**
 * Validates that the plugin is allowed to access the requested table.
 * Plugins can only access tables starting with "plugin_{pluginName}_" or explicitly allowed tables.
 */
function validateTableAccess(pluginName: string, table: string) {
    // Allow access to own tables
    const prefix = `plugin_${pluginName.replace(/-/g, "_")}_`;
    if (table.startsWith(prefix)) return true;

    // TODO: Check manifest permissions for other tables (e.g. "db:read:users")
    // For now, strict scoping.
    throw new Error(`Access denied to table ${table}`);
}

/**
 * Simple SQL builder for SQLite.
 * WARNING: This is a basic implementation. In production, use a proper query builder.
 */
export async function handleDbRequest(pluginName: string, req: DbRequest) {
    validateTableAccess(pluginName, req.table);

    switch (req.operation) {
        case "findMany": {
            const { sql, params } = buildSelect(req.table, req.where, req.limit, req.offset, req.orderBy);
            return await executeQuery(sql, params);
        }
        case "findOne": {
            const { sql, params } = buildSelect(req.table, req.where, 1, undefined, req.orderBy);
            const res = await executeQuery(sql, params);
            return Array.isArray(res) ? res[0] : res.rows?.[0] ?? null;
        }
        case "insert": {
            const keys = Object.keys(req.data);
            const values = Object.values(req.data);
            const placeholders = keys.map(() => "?").join(", ");
            const sql = `INSERT INTO ${req.table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
            return await executeQuery(sql, values);
        }
        case "update": {
            const keys = Object.keys(req.data);
            const values = Object.values(req.data);
            const setClauses = keys.map(k => `${k} = ?`).join(", ");

            let sql = `UPDATE ${req.table} SET ${setClauses}`;
            const params = [...values];

            if (req.where && Object.keys(req.where).length > 0) {
                const conditions: string[] = [];
                for (const [key, val] of Object.entries(req.where)) {
                    conditions.push(`${key} = ?`);
                    params.push(val);
                }
                sql += ` WHERE ${conditions.join(" AND ")}`;
            }

            sql += " RETURNING *";
            return await executeQuery(sql, params);
        }
        case "delete": {
            let sql = `DELETE FROM ${req.table}`;
            const params: any[] = [];

            if (req.where && Object.keys(req.where).length > 0) {
                const conditions: string[] = [];
                for (const [key, val] of Object.entries(req.where)) {
                    conditions.push(`${key} = ?`);
                    params.push(val);
                }
                sql += ` WHERE ${conditions.join(" AND ")}`;
            }

            return await executeQuery(sql, params);
        }
        default:
            throw new Error(`Operation ${req.operation} not implemented`);
    }
}

function buildSelect(table: string, where?: Record<string, any>, limit?: number, offset?: number, orderBy?: string) {
    let sql = `SELECT * FROM ${table}`;
    const params: any[] = [];

    if (where && Object.keys(where).length > 0) {
        const conditions: string[] = [];
        for (const [key, val] of Object.entries(where)) {
            conditions.push(`${key} = ?`);
            params.push(val);
        }
        sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    if (orderBy) {
        // Basic sanitization: only allow alphanumeric, spaces, comma, DESC/ASC
        if (/^[a-zA-Z0-9_,\s]+(?:\s+(?:ASC|DESC))?$/i.test(orderBy)) {
            sql += ` ORDER BY ${orderBy}`;
        }
    }

    if (limit !== undefined) {
        sql += ` LIMIT ?`;
        params.push(limit);
    }

    if (offset !== undefined) {
        sql += ` OFFSET ?`;
        params.push(offset);
    }

    return { sql, params };
}
