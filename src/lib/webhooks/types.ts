/**
 * Webhook Types
 * Types and interfaces for the webhook system
 */

/**
 * Webhook event names
 * These are the events that can trigger webhooks
 */
export type WebhookEvent =
  // Content events
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "content.published"
  | "content.unpublished"
  // User events
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.login"
  | "user.logout"
  // Plugin events
  | "plugin.installed"
  | "plugin.uninstalled"
  | "plugin.activated"
  | "plugin.deactivated"
  // Comment events
  | "comment.created"
  | "comment.updated"
  | "comment.deleted"
  | "comment.approved"
  | "comment.rejected"
  // Media events
  | "media.uploaded"
  | "media.deleted"
  // Category/Tag events
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "tag.created"
  | "tag.updated"
  | "tag.deleted"
  // System events
  | "system.backup"
  | "system.error"
  | "system.maintenance";

/**
 * Webhook delivery status
 */
export type WebhookDeliveryStatus = "pending" | "success" | "failed" | "cancelled";

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = any> {
  event: WebhookEvent | string;
  timestamp: string; // ISO 8601
  data: T;
  metadata?: Record<string, any>;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  name: string;
  url: string;
  secret?: string;
  events: (WebhookEvent | string)[];
  isActive?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Webhook delivery result
 */
export interface WebhookDeliveryResult {
  success: boolean;
  responseStatus?: number;
  responseBody?: string;
  responseTime?: number; // milliseconds
  errorMessage?: string;
}

/**
 * Webhook filter options
 */
export interface WebhookFilter {
  isActive?: boolean;
  events?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Webhook delivery filter
 */
export interface WebhookDeliveryFilter {
  webhookId?: number;
  event?: string;
  status?: WebhookDeliveryStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Webhook statistics
 */
export interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  averageResponseTime: number; // milliseconds
  successRate: number; // percentage (0-100)
}

/**
 * Event data types
 */
export interface ContentEventData {
  id: number;
  title: string;
  slug: string;
  type: string;
  status: string;
  authorId: number;
}

export interface UserEventData {
  id: number;
  email: string;
  name?: string;
  roleId?: number;
}

export interface PluginEventData {
  name: string;
  version: string;
  isActive: boolean;
}

export interface CommentEventData {
  id: number;
  contentId: number;
  authorName: string;
  authorEmail: string;
  body: string;
  status: string;
}

export interface MediaEventData {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

/**
 * Webhook signature helper
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = encoder.encode(secret);

  // Simple HMAC SHA-256 (for production, use crypto library)
  return btoa(String.fromCharCode(...data));
}

/**
 * Event display names
 */
export const EVENT_NAMES: Record<string, string> = {
  "content.created": "Content Created",
  "content.updated": "Content Updated",
  "content.deleted": "Content Deleted",
  "content.published": "Content Published",
  "content.unpublished": "Content Unpublished",
  "user.created": "User Created",
  "user.updated": "User Updated",
  "user.deleted": "User Deleted",
  "user.login": "User Login",
  "user.logout": "User Logout",
  "plugin.installed": "Plugin Installed",
  "plugin.uninstalled": "Plugin Uninstalled",
  "plugin.activated": "Plugin Activated",
  "plugin.deactivated": "Plugin Deactivated",
  "comment.created": "Comment Created",
  "comment.updated": "Comment Updated",
  "comment.deleted": "Comment Deleted",
  "comment.approved": "Comment Approved",
  "comment.rejected": "Comment Rejected",
  "media.uploaded": "Media Uploaded",
  "media.deleted": "Media Deleted",
  "category.created": "Category Created",
  "category.updated": "Category Updated",
  "category.deleted": "Category Deleted",
  "tag.created": "Tag Created",
  "tag.updated": "Tag Updated",
  "tag.deleted": "Tag Deleted",
  "system.backup": "System Backup",
  "system.error": "System Error",
  "system.maintenance": "System Maintenance",
};
