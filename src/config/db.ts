import {
  drizzle as drizzleSQLite,
  type LibSQLDatabase,
} from "drizzle-orm/libsql";
import {
  drizzle as drizzlePostgres,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.ts";
import { env, isProduction } from "./env.ts";

const processRef = globalThis.process as
  | (NodeJS.Process & { report?: { getReport?: () => unknown } })
  | undefined;

if (processRef) {
  const existingReport = processRef.report;

  if (existingReport && typeof existingReport === "object") {
    const originalGetReport = existingReport.getReport?.bind(existingReport);
    existingReport.getReport = () => {
      if (originalGetReport) {
        try {
          return originalGetReport();
        } catch {
          // noop
        }
      }
      return { header: {} };
    };
  } else {
    Object.defineProperty(processRef, "report", {
      configurable: true,
      enumerable: false,
      get() {
        return {
          getReport: () => ({ header: {} }),
        };
      },
    });
  }
}

let createClient: any;
let clientSource = "node";

try {
  ({ createClient } = await import("npm:@libsql/client@^0.14/node"));
} catch (error) {
  console.warn(
    "Falling back to @libsql/client web runtime due to error loading native module:",
    error instanceof Error ? error.message : error,
  );
  clientSource = "web";
  ({ createClient } = await import("npm:@libsql/client@^0.14/web"));
}

if (!createClient) {
  throw new Error("Unable to load @libsql/client for the current runtime.");
}

// Configuración de la conexión según el entorno
const sqliteClient = !isProduction
  ? createClient({
      url: env.DATABASE_URL,
      authToken: env.DATABASE_AUTH_TOKEN,
    })
  : null;

const sqliteDb = sqliteClient
  ? drizzleSQLite(sqliteClient, {
      schema,
    })
  : null;

const postgresDb = drizzlePostgres(postgres(env.DATABASE_URL), {
  schema,
});

type SqliteDatabase = LibSQLDatabase<typeof schema>;
type PostgresDatabase = PostgresJsDatabase<typeof schema>;

// Unificar el tipo para evitar uniones incompatibles durante el type checking.
// En producción usamos Postgres, en desarrollo SQLite, pero exponemos una interfase
// común basada en la firma de LibSQL para mantener compatibilidad en la capa de servicios.
export const db: SqliteDatabase = isProduction
  ? (postgresDb as unknown as SqliteDatabase)
  : (sqliteDb as SqliteDatabase);

export type Database = SqliteDatabase | PostgresDatabase;
