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
