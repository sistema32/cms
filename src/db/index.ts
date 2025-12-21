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

// Usamos un tipo unificado para exponer una interfaz consistente de Drizzle
// aunque la instancia concreta dependa del motor seleccionado en runtime.
// Se tipa como LibSQLDatabase para evitar uniones incompatibles entre drivers.
export type Database = LibSQLDatabase<typeof schema>;

let dbInstance: any;
let loggedWasmFallback = false;

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
  let clientUrl = url;
  let client: any;

  // Try native client first, then fall back to WASM when sys perms are restricted
  try {
    const mod = await import("npm:@libsql/client@^0.14/node");
    const factory = (mod as any).createClient ?? (mod as any).default;
    client = factory({
      url,
      authToken: env.DATABASE_AUTH_TOKEN,
    });
  } catch (err) {
    if (!loggedWasmFallback) {
      const reason = err instanceof Error ? err.message : String(err);
      console.info(
        "[db] Falling back to @libsql/client-wasm (native client unavailable):",
        reason,
      );
      loggedWasmFallback = true;
    }
    clientUrl = url.startsWith("file:") ? ":memory:" : url;
    client = createClientWasm({
      url: clientUrl,
      authToken: env.DATABASE_AUTH_TOKEN,
    });
  }

  dbInstance = drizzleSQLite(client, { schema });

  // Enable WAL mode for better concurrency (only for local files and when supported)
  if (
    clientUrl.startsWith("file:") && typeof (client as any)?.execute === "function"
  ) {
    try {
      await client.execute("PRAGMA journal_mode = WAL;");
      await client.execute("PRAGMA busy_timeout = 5000;");
    } catch (err) {
      console.warn("Failed to configure SQLite:", err);
    }
  }

  // Bootstrap a minimal in-memory schema for tests/sandboxes where native SQLite isn't available
  if (
    clientUrl === ":memory:" && typeof (client as any)?.execute === "function"
  ) {
    await bootstrapInMemorySchema(client);
  }
}

// Cast explícito para presentar una superficie común y evitar errores de tipos
export const db: Database = dbInstance as Database;

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

async function bootstrapInMemorySchema(client: any) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS email_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "to" TEXT NOT NULL,
      "from" TEXT,
      subject TEXT NOT NULL,
      text TEXT,
      html TEXT,
      attachments TEXT,
      headers TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      last_attempt_at INTEGER,
      next_retry_at INTEGER,
      sent_at INTEGER,
      error TEXT,
      provider TEXT,
      provider_message_id TEXT,
      metadata TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL DEFAULT '',
      name TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      role_id INTEGER,
      two_factor_enabled INTEGER DEFAULT 0,
      two_factor_secret TEXT,
      last_login_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    );`,
    `CREATE TABLE IF NOT EXISTS content_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      is_public INTEGER DEFAULT 1,
      has_categories INTEGER DEFAULT 1,
      has_tags INTEGER DEFAULT 1,
      has_comments INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id INTEGER,
      category_id INTEGER,
      content_type_id INTEGER,
      color TEXT,
      icon TEXT,
      "order" INTEGER DEFAULT 0,
      deleted_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS category_seo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL UNIQUE,
      meta_title TEXT,
      meta_description TEXT,
      canonical_url TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      og_type TEXT DEFAULT 'website',
      twitter_card TEXT DEFAULT 'summary_large_image',
      twitter_title TEXT,
      twitter_description TEXT,
      twitter_image TEXT,
      schema_json TEXT,
      focus_keyword TEXT,
      no_index INTEGER DEFAULT 0,
      no_follow INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      hash TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      url TEXT NOT NULL,
      storage_provider TEXT DEFAULT 'local',
      type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      duration INTEGER,
      uploaded_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS media_sizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      path TEXT NOT NULL,
      url TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS media_seo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL UNIQUE,
      alt TEXT,
      title TEXT,
      caption TEXT,
      description TEXT,
      focus_keyword TEXT,
      credits TEXT,
      copyright TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type_id INTEGER NOT NULL,
      parent_id INTEGER,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      body TEXT,
      featured_image_id INTEGER,
      author_id INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      visibility TEXT DEFAULT 'public',
      password TEXT,
      published_at INTEGER,
      scheduled_at INTEGER,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      comments_enabled INTEGER DEFAULT 0,
      template TEXT,
      featured INTEGER DEFAULT 0,
      sticky INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS content_categories (
      content_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (content_id, category_id)
    );`,
    `CREATE TABLE IF NOT EXISTS content_tags (
      content_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (content_id, tag_id)
    );`,
    `CREATE TABLE IF NOT EXISTS content_seo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL UNIQUE,
      meta_title TEXT,
      meta_description TEXT,
      canonical_url TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      og_type TEXT DEFAULT 'article',
      twitter_card TEXT DEFAULT 'summary_large_image',
      twitter_title TEXT,
      twitter_description TEXT,
      twitter_image TEXT,
      schema_json TEXT,
      focus_keyword TEXT,
      no_index INTEGER DEFAULT 0,
      no_follow INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS content_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      type TEXT DEFAULT 'string',
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS ip_block_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      reason TEXT,
      expires_at INTEGER,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      ip TEXT NOT NULL,
      user_agent TEXT,
      path TEXT,
      method TEXT,
      user_id INTEGER,
      details TEXT,
      severity TEXT DEFAULT 'low',
      rule_id INTEGER,
      blocked INTEGER DEFAULT 0,
      referer TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS security_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      category TEXT NOT NULL,
      description TEXT,
      updated_by INTEGER,
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS security_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      pattern TEXT NOT NULL,
      action TEXT NOT NULL,
      severity TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      trigger_count INTEGER DEFAULT 0,
      description TEXT,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS rate_limit_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      method TEXT,
      max_requests INTEGER NOT NULL,
      window_seconds INTEGER NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS plugins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT,
      version TEXT,
      description TEXT,
      author TEXT,
      homepage TEXT,
      source_url TEXT,
      manifest_hash TEXT,
      manifest_signature TEXT,
      status TEXT DEFAULT 'inactive',
      is_system INTEGER DEFAULT 0,
      settings TEXT,
      permissions TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS plugin_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plugin_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      applied_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS plugin_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plugin_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ok',
      last_checked_at INTEGER,
      last_error TEXT,
      latency_ms INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS plugin_permission_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plugin_id INTEGER NOT NULL,
      permission TEXT NOT NULL,
      granted INTEGER DEFAULT 1,
      granted_by INTEGER,
      granted_at INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      description TEXT,
      changes TEXT,
      metadata TEXT,
      ip_address TEXT,
      user_agent TEXT,
      level TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      secret TEXT,
      events TEXT,
      is_active INTEGER DEFAULT 1,
      max_retries INTEGER DEFAULT 3,
      retry_delay INTEGER DEFAULT 5,
      total_deliveries INTEGER DEFAULT 0,
      successful_deliveries INTEGER DEFAULT 0,
      failed_deliveries INTEGER DEFAULT 0,
      last_delivery_at INTEGER,
      last_success_at INTEGER,
      last_failure_at INTEGER,
      description TEXT,
      metadata TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      subject TEXT,
      text_template TEXT,
      html_template TEXT,
      variables TEXT,
      description TEXT,
      category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      email_notifications INTEGER DEFAULT 1,
      email_digest INTEGER DEFAULT 0,
      notify_comments INTEGER DEFAULT 1,
      notify_replies INTEGER DEFAULT 1,
      notify_mentions INTEGER DEFAULT 1,
      notify_content_published INTEGER DEFAULT 1,
      notify_system_alerts INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      title TEXT NOT NULL,
      message TEXT,
      icon TEXT,
      data TEXT,
      is_read INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'normal',
      category TEXT,
      link TEXT,
      action_label TEXT,
      action_url TEXT,
      email_sent INTEGER DEFAULT 0,
      email_sent_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      expires_at INTEGER,
      read_at INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category TEXT,
      autoload INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );`,
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err) {
      console.warn("[db] Failed to bootstrap in-memory table:", err);
    }
  }

  // Seed superadmin role and user so RBAC tests have a privileged principal
  try {
    await client.execute(
      `INSERT OR IGNORE INTO roles (id, name, description, is_system) VALUES (1, 'superadmin', 'Default superadmin role', 1);`,
    );

    const superEmail = Deno.env.get("SUPERADMIN_EMAIL") ?? "admin@example.com";
    const superPassword = Deno.env.get("SUPERADMIN_PASSWORD") ?? "password123";
    const { hashPassword } = await import("../utils/password.ts");
    const hashed = await hashPassword(superPassword);

    await client.execute({
      sql:
        `INSERT OR IGNORE INTO users (id, email, password, name, status, role_id, created_at, updated_at) VALUES (1, ?, ?, 'Super Admin', 'active', 1, (unixepoch()), (unixepoch()));`,
      args: [superEmail, hashed],
    });
  } catch (err) {
    console.warn("[db] Failed to seed superadmin:", err);
  }

  // Seed basic settings to avoid missing-table errors in frontend fallbacks
  try {
    await client.execute(
      `INSERT OR IGNORE INTO settings (key, value, category, autoload, created_at, updated_at) VALUES ('blog_base', 'blog', 'general', 0, (unixepoch()), (unixepoch()));`,
    );
    await client.execute(
      `INSERT OR IGNORE INTO settings (key, value, category, autoload, created_at, updated_at) VALUES ('active_theme', 'default', 'themes', 0, (unixepoch()), (unixepoch()));`,
    );
  } catch (err) {
    console.warn("[db] Failed to seed settings defaults:", err);
  }

  // Seed minimal email template used in tests
  try {
    await client.execute({
      sql:
        `INSERT OR IGNORE INTO email_templates (name, subject, text_template, html_template, variables, category, is_active, created_at, updated_at)
        VALUES ('welcome', 'Welcome to LexCMS', 'Hi {{name}}, welcome to LexCMS.', '<p>Hi {{name}}, welcome to <strong>LexCMS</strong>.</p>', '["name"]', 'system', 1, (unixepoch()), (unixepoch()));`,
    });
  } catch (err) {
    console.warn("[db] Failed to seed email template:", err);
  }
}
