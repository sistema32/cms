/**
 * Audit Log Types
 * Types and interfaces for the audit logging system
 */

import type { Context } from "hono";

/**
 * Log severity levels
 */
export type AuditLogLevel = "debug" | "info" | "warning" | "error" | "critical";

/**
 * Common entity types
 */
export type AuditEntity =
  | "user"
  | "role"
  | "permission"
  | "content"
  | "category"
  | "tag"
  | "media"
  | "menu"
  | "comment"
  | "setting"
  | "plugin"
  | "theme"
  | "system";

/**
 * Common action types
 */
export type AuditAction =
  // CRUD operations
  | "create"
  | "read"
  | "update"
  | "delete"
  // Auth operations
  | "login"
  | "logout"
  | "register"
  | "password_change"
  | "password_reset"
  | "2fa_enable"
  | "2fa_disable"
  // Content operations
  | "publish"
  | "unpublish"
  | "approve"
  | "reject"
  | "restore"
  // Plugin operations
  | "install"
  | "uninstall"
  | "activate"
  | "deactivate"
  | "configure"
  // System operations
  | "cache_clear"
  | "backup"
  | "restore_backup"
  | "migration"
  | "maintenance_enable"
  | "maintenance_disable";

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  userId?: number;
  userEmail?: string;
  action: AuditAction | string;
  entity: AuditEntity | string;
  entityId?: string | number;
  description?: string;
  changes?: Record<string, { before: any; after: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  level?: AuditLogLevel;
}

/**
 * Audit log filter options
 */
export interface AuditLogFilter {
  userId?: number;
  userEmail?: string;
  action?: string | string[];
  entity?: string | string[];
  entityId?: string;
  level?: AuditLogLevel | AuditLogLevel[];
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "level" | "action" | "entity";
  sortOrder?: "asc" | "desc";
}

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  totalLogs: number;
  byLevel: Record<AuditLogLevel, number>;
  byEntity: Record<string, number>;
  byAction: Record<string, number>;
  byUser: Array<{ userId: number; userEmail: string; count: number }>;
  recentErrors: number; // Count of errors in last 24h
  recentCritical: number; // Count of critical in last 24h
}

/**
 * Context for audit logging
 */
export interface AuditContext {
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract audit context from Hono context
 */
export function extractAuditContext(c: Context): AuditContext {
  const user = c.get("user");
  const ipAddress =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    c.req.header("x-real-ip") ||
    "unknown";
  const userAgent = c.req.header("user-agent") || "unknown";

  return {
    userId: user?.id,
    userEmail: user?.email,
    ipAddress,
    userAgent,
  };
}

/**
 * Action descriptions for common operations
 */
export const ACTION_DESCRIPTIONS: Record<string, string> = {
  // CRUD
  create: "Created",
  read: "Viewed",
  update: "Updated",
  delete: "Deleted",
  // Auth
  login: "Logged in",
  logout: "Logged out",
  register: "Registered",
  password_change: "Changed password",
  password_reset: "Reset password",
  "2fa_enable": "Enabled 2FA",
  "2fa_disable": "Disabled 2FA",
  // Content
  publish: "Published",
  unpublish: "Unpublished",
  approve: "Approved",
  reject: "Rejected",
  restore: "Restored",
  // Plugin
  install: "Installed",
  uninstall: "Uninstalled",
  activate: "Activated",
  deactivate: "Deactivated",
  configure: "Configured",
  // System
  cache_clear: "Cleared cache",
  backup: "Created backup",
  restore_backup: "Restored backup",
  migration: "Ran migration",
  maintenance_enable: "Enabled maintenance mode",
  maintenance_disable: "Disabled maintenance mode",
};

/**
 * Entity display names
 */
export const ENTITY_NAMES: Record<string, string> = {
  user: "User",
  role: "Role",
  permission: "Permission",
  content: "Content",
  category: "Category",
  tag: "Tag",
  media: "Media",
  menu: "Menu",
  comment: "Comment",
  setting: "Setting",
  plugin: "Plugin",
  theme: "Theme",
  system: "System",
};
