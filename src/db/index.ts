import {
  drizzle as drizzleSQLite,
  type LibSQLDatabase,
} from "drizzle-orm/libsql";
import {
  drizzle as drizzlePostgres,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import {
  drizzle as drizzleMySQL,
  type MySql2Database,
} from "drizzle-orm/mysql2";
import postgres from "postgres";
import mysql from "mysql2/promise";
import { createClient as createClientWasm } from "npm:@libsql/client-wasm@^0.14";
import * as schema from "./schema.ts";
import { env } from "../config/env.ts";
import { getDbType } from "./config/database-type.ts";

// Detectar tipo de base de datos
const dbType = getDbType();

// Definir tipo unificado para la DB
export type Database =
  | LibSQLDatabase<typeof schema>
  | PostgresJsDatabase<typeof schema>
  | MySql2Database<typeof schema>;

let dbInstance: Database;

if (dbType === "postgresql") {
  const client = postgres(env.DATABASE_URL);
  dbInstance = drizzlePostgres(client, { schema });
} else if (dbType === "mysql") {
  // Note: MySQL connection is async, but top-level await is supported in Deno
  const connection = await mysql.createConnection(env.DATABASE_URL);
  dbInstance = drizzleMySQL(connection, { schema, mode: "default" });
} else {
  // SQLite / Turso
  const url = env.DATABASE_URL || "file:local.db";

  const mod = await import("npm:@libsql/client@^0.14/node");
  const factory = (mod as any).createClient ?? (mod as any).default;
  const client = factory({
    url,
    authToken: env.DATABASE_AUTH_TOKEN,
  });
  dbInstance = drizzleSQLite(client, { schema });

  // Enable WAL mode for better concurrency
  if (url.startsWith("file:")) {
    try {
      await client.execute("PRAGMA journal_mode = WAL;");
      await client.execute("PRAGMA busy_timeout = 5000;");
    } catch (err) {
      console.warn("Failed to configure SQLite:", err);
    }
  }
}

export const db = dbInstance;

/**
 * Helper to execute raw queries across different database drivers
 * Handles the differences between SQLite (.all/.run) and Postgres/MySQL (.execute)
 */
import { type SQL, sql } from "drizzle-orm";

export async function executeQuery(
  query: string | SQL,
  params: any[] = [],
): Promise<any> {
  const type = getDbType();

  // Convert string query + params to Drizzle SQL object
  let sqlQuery: SQL;
  if (typeof query === "string") {
    // Build SQL using sql.raw with parameters
    // For parameterized queries, we need to manually construct the SQL object
    // Replace ? placeholders with actual values using sql helper
    const parts = query.split("?");
    if (parts.length === 1) {
      // No parameters
      sqlQuery = sql.raw(query);
    } else {
      // Has parameters - build SQL with proper escaping
      const sqlParts: (string | SQL)[] = [sql.raw(parts[0])];
      for (let i = 0; i < params.length; i++) {
        sqlParts.push(sql`${params[i]}`);
        sqlParts.push(sql.raw(parts[i + 1] || ""));
      }
      sqlQuery = sql.join(sqlParts, sql.raw(""));
    }
  } else {
    sqlQuery = query;
  }

  try {
    if (type === "sqlite") {
      // For SQLite, check query type
      const queryStr = typeof query === "string"
        ? query.trim().toUpperCase()
        : "";

      // Use .all() for SELECT and INSERT...RETURNING
      if (queryStr.startsWith("SELECT") || queryStr.includes("RETURNING")) {
        return await (db as any).all(sqlQuery);
      } else {
        // Use .run() for INSERT/UPDATE/DELETE without RETURNING
        return await (db as any).run(sqlQuery);
      }
    } else {
      // PostgreSQL and MySQL use .execute()
      const result = await (db as any).execute(sqlQuery);
      return result;
    }
  } catch (error) {
    console.error(`Database execution error (${type}):`, error);
    throw error;
  }
}
