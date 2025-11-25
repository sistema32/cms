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
import { createClient } from "npm:@libsql/client@^0.14/node";
import * as schema from "./schema.ts";
import { env } from "../config/env.ts";
import { getDbType } from "./config/database-type.ts";

// Detectar tipo de base de datos
const dbType = getDbType();

// Definir tipo unificado para la DB
export type Database = LibSQLDatabase<typeof schema> | PostgresJsDatabase<typeof schema> | MySql2Database<typeof schema>;

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
  const client = createClient({
    url: env.DATABASE_URL || "file:local.db",
    authToken: env.DATABASE_AUTH_TOKEN,
  });
  dbInstance = drizzleSQLite(client, { schema });
}

export const db = dbInstance;

/**
 * Helper to execute raw queries across different database drivers
 * Handles the differences between SQLite (.all/.run) and Postgres/MySQL (.execute)
 */
import { sql, type SQL } from "drizzle-orm";

export async function executeQuery(query: string | SQL, params: any[] = []): Promise<any> {
  const type = getDbType();

  // Convert string query to SQL object if needed
  const sqlQuery = typeof query === 'string' ? sql.raw(query) : query;

  // If params are provided with string query, we might need to handle them differently
  // depending on the driver, but drizzle's sql.raw usually handles binding if passed correctly.
  // However, for raw strings from plugins, we might need to be careful.
  // For now, we assume the query string already has placeholders and params are passed separately
  // OR the caller constructs a proper SQL object.

  // NOTE: For plugins, we receive a raw string and params. 
  // We should ideally use sql.raw(query, params) but params support depends on implementation.

  try {
    if (type === "sqlite") {
      // SQLite uses .all() for reads and .run() for writes, but .all() works for both in many cases
      // or we can check the query type. For simplicity, we use .all() which returns rows.
      // For INSERT/UPDATE, it might return empty array or result depending on driver.
      return await (db as any).all(sqlQuery);
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
