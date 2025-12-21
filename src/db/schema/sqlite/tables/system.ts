import {
    integer,
    index,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth.ts";

// ============= AUDIT LOGS =============
export const auditLogs = sqliteTable("audit_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // Who performed the action
    userId: integer("user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    userEmail: text("user_email"), // Store email in case user is deleted

    // What action was performed
    action: text("action").notNull(), // create, update, delete, login, logout, etc.
    entity: text("entity").notNull(), // user, content, plugin, setting, etc.
    entityId: text("entity_id"), // ID of the affected entity

    // Details
    description: text("description"), // Human-readable description
    changes: text("changes"), // JSON with before/after values
    metadata: text("metadata"), // JSON with additional context

    // Request context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Severity level
    level: text("level").notNull().default("info"), // debug, info, warning, error, critical

    // Timestamp
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= SETTINGS =============
export const settings = sqliteTable("settings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull().unique(),
    value: text("value"), // JSON stringified para valores complejos
    category: text("category").notNull().default("general"), // Agrupar settings por categoría
    autoload: integer("autoload", { mode: "boolean" }).notNull().default(true), // WordPress-style: cargar en cache automáticamente
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= WEBHOOKS =============
export const webhooks = sqliteTable("webhooks", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Configuration
    name: text("name").notNull(), // User-friendly name
    url: text("url").notNull(), // Target URL
    secret: text("secret"), // Secret for signature verification

    // Events to listen to
    events: text("events").notNull(), // JSON array of event names

    // Status
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

    // Retry configuration
    maxRetries: integer("max_retries").notNull().default(3),
    retryDelay: integer("retry_delay").notNull().default(60), // seconds

    // Statistics
    totalDeliveries: integer("total_deliveries").notNull().default(0),
    successfulDeliveries: integer("successful_deliveries").notNull().default(0),
    failedDeliveries: integer("failed_deliveries").notNull().default(0),
    lastDeliveryAt: integer("last_delivery_at", { mode: "timestamp" }),
    lastSuccessAt: integer("last_success_at", { mode: "timestamp" }),
    lastFailureAt: integer("last_failure_at", { mode: "timestamp" }),

    // Metadata
    description: text("description"),
    metadata: text("metadata"), // JSON for additional config

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Reference
    webhookId: integer("webhook_id").notNull().references(() => webhooks.id, {
        onDelete: "cascade",
    }),

    // Event data
    event: text("event").notNull(), // Event name (e.g., "content.created")
    payload: text("payload").notNull(), // JSON payload sent

    // Delivery attempt
    attempt: integer("attempt").notNull().default(1), // Current attempt number
    status: text("status").notNull(), // pending, success, failed, cancelled

    // Response
    responseStatus: integer("response_status"), // HTTP status code
    responseBody: text("response_body"), // Response body (truncated)
    responseTime: integer("response_time"), // Response time in ms

    // Error details
    errorMessage: text("error_message"),

    // Timestamps
    scheduledAt: integer("scheduled_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
    nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),

    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= EMAIL QUEUE =============
export const emailQueue = sqliteTable("email_queue", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    to: text("to").notNull(), // JSON array of recipients
    from: text("from"), // JSON object
    subject: text("subject").notNull(),
    text: text("text"),
    html: text("html"),
    attachments: text("attachments"), // JSON array
    headers: text("headers"), // JSON object
    priority: text("priority").notNull().default("normal"), // high, normal, low
    status: text("status").notNull().default("pending"), // pending, processing, sent, failed, cancelled
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastAttemptAt: integer("last_attempt_at", { mode: "timestamp" }),
    nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),
    sentAt: integer("sent_at", { mode: "timestamp" }),
    error: text("error"),
    provider: text("provider"), // smtp, sendgrid, mailgun, etc.
    providerMessageId: text("provider_message_id"),
    metadata: text("metadata"), // JSON object
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= EMAIL TEMPLATES =============
export const emailTemplates = sqliteTable("email_templates", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    subject: text("subject").notNull(),
    textTemplate: text("text_template").notNull(),
    htmlTemplate: text("html_template").notNull(),
    variables: text("variables"), // JSON array of variable names
    description: text("description"),
    category: text("category"), // auth, notification, system, etc.
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= NOTIFICATIONS =============
export const notifications = sqliteTable("notifications", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    type: text("type").notNull(), // comment.new, mention, content.published, etc.
    title: text("title").notNull(),
    message: text("message").notNull(),
    icon: text("icon"),
    link: text("link"),
    actionLabel: text("action_label"),
    actionUrl: text("action_url"),
    data: text("data"), // JSON additional data
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    readAt: integer("read_at", { mode: "timestamp" }),
    emailSent: integer("email_sent", { mode: "boolean" }).notNull().default(
        false,
    ),
    emailSentAt: integer("email_sent_at", { mode: "timestamp" }),
    priority: text("priority").notNull().default("normal"), // low, normal, high
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
}, (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

// ============= NOTIFICATION PREFERENCES =============
export const notificationPreferences = sqliteTable("notification_preferences", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().unique().references(() => users.id, {
        onDelete: "cascade",
    }),
    emailNotifications: integer("email_notifications", { mode: "boolean" })
        .notNull().default(true),
    emailDigest: text("email_digest").notNull().default("daily"), // never, daily, weekly
    notifyComments: integer("notify_comments", { mode: "boolean" }).notNull()
        .default(true),
    notifyReplies: integer("notify_replies", { mode: "boolean" }).notNull()
        .default(true),
    notifyMentions: integer("notify_mentions", { mode: "boolean" }).notNull()
        .default(true),
    notifyContentPublished: integer("notify_content_published", {
        mode: "boolean",
    }).notNull().default(true),
    notifySystemAlerts: integer("notify_system_alerts", { mode: "boolean" })
        .notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= BACKUPS =============
export const backups = sqliteTable("backups", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    filename: text("filename").notNull(),
    type: text("type").notNull(), // full, database, media, config
    size: integer("size").notNull(), // bytes
    status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
    storageProvider: text("storage_provider").notNull().default("local"), // local, s3
    storagePath: text("storage_path").notNull(),
    compressed: integer("compressed", { mode: "boolean" }).notNull().default(
        true,
    ),
    includesMedia: integer("includes_media", { mode: "boolean" }).notNull()
        .default(false),
    includesDatabase: integer("includes_database", { mode: "boolean" }).notNull()
        .default(false),
    includesConfig: integer("includes_config", { mode: "boolean" }).notNull()
        .default(false),
    checksum: text("checksum").notNull(), // SHA-256
    error: text("error"),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= SECURITY =============

// IP Block Rules
export const ipBlockRules = sqliteTable("ip_block_rules", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ip: text("ip").notNull().unique(),
    type: text("type").notNull(), // block, whitelist
    reason: text("reason"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// Security Events
export const securityEvents = sqliteTable("security_events", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type").notNull(),
    ip: text("ip").notNull(),
    userAgent: text("user_agent"),
    path: text("path"),
    method: text("method"),
    userId: integer("user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    details: text("details"), // JSON
    severity: text("severity").notNull().default("low"),
    ruleId: integer("rule_id"), // Reference to security rule that triggered this event
    blocked: integer("blocked", { mode: "boolean" }).notNull().default(false), // Whether request was blocked
    referer: text("referer"), // HTTP Referer header
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// Rate Limit Rules (Custom rate limiting per endpoint)
export const rateLimitRules = sqliteTable("rate_limit_rules", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    path: text("path").notNull(), // /api/auth/login, /api/content, etc.
    method: text("method"), // GET, POST, PUT, DELETE, null = all methods
    maxRequests: integer("max_requests").notNull(), // Max requests allowed
    windowSeconds: integer("window_seconds").notNull(), // Time window in seconds
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// Security Rules (Custom security patterns)
export const securityRules = sqliteTable("security_rules", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    type: text("type").notNull(), // sql_injection, xss, path_traversal, custom
    pattern: text("pattern").notNull(), // Regex pattern to match
    action: text("action").notNull(), // block, log, alert
    severity: text("severity").notNull(), // critical, high, medium, low
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    triggerCount: integer("trigger_count").notNull().default(0), // How many times this rule was triggered
    description: text("description"), // Optional description
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// Security Settings (Configuration for security features)
export const securitySettings = sqliteTable("security_settings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    type: text("type").notNull().default("string"), // string, number, boolean, json
    category: text("category").notNull(), // rate_limit, headers, notifications, cleanup
    description: text("description"),
    updatedBy: integer("updated_by").references(() => users.id, {
        onDelete: "set null",
    }),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= JOBS =============

// Background Jobs Queue
export const jobs = sqliteTable("jobs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(), // Job type
    data: text("data").notNull(), // JSON payload
    status: text("status").notNull().default("pending"), // pending, active, completed, failed, delayed, cancelled
    priority: text("priority").notNull().default("normal"), // low, normal, high, critical
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    progress: integer("progress").notNull().default(0), // 0-100
    result: text("result"), // JSON result
    error: text("error"),
    startedAt: integer("started_at", { mode: "timestamp" }),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    failedAt: integer("failed_at", { mode: "timestamp" }),
    scheduledFor: integer("scheduled_for", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Scheduled Jobs (cron-like)
export const scheduledJobs = sqliteTable("scheduled_jobs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    schedule: text("schedule").notNull(), // Cron expression
    jobName: text("job_name").notNull(), // Job type to create
    jobData: text("job_data").notNull(), // JSON data
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    lastRunAt: integer("last_run_at", { mode: "timestamp" }),
    nextRunAt: integer("next_run_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ============= TYPES =============
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

export type EmailQueue = typeof emailQueue.$inferSelect;
export type NewEmailQueue = typeof emailQueue.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type NotificationPreference =
    typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
    typeof notificationPreferences.$inferInsert;

export type Backup = typeof backups.$inferSelect;
export type NewBackup = typeof backups.$inferInsert;

export type IPBlockRule = typeof ipBlockRules.$inferSelect;
export type NewIPBlockRule = typeof ipBlockRules.$inferInsert;

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;

export type RateLimitRule = typeof rateLimitRules.$inferSelect;
export type NewRateLimitRule = typeof rateLimitRules.$inferInsert;

export type SecurityRule = typeof securityRules.$inferSelect;
export type NewSecurityRule = typeof securityRules.$inferInsert;

export type SecuritySetting = typeof securitySettings.$inferSelect;
export type NewSecuritySetting = typeof securitySettings.$inferInsert;
