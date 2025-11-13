/**
 * System Updates Module - Configuration
 * Default configuration for system updates
 */

import type { UpdateServerConfig } from "./types.ts";

/**
 * Default update server configuration
 */
export const defaultUpdateConfig: UpdateServerConfig = {
  enabled: true,
  serverUrl: "https://updates.example.com/api/v1",
  checkInterval: 360, // 6 hours
  autoDownload: false,
  autoInstall: false,
  allowPrerelease: false,

  // Security settings
  verifyChecksum: true,
  verifySignature: true,
  requireHttps: true,

  // Notification settings
  notifyOnUpdate: true,

  // Backup settings
  autoBackupBeforeUpdate: true,
  keepBackupDays: 30,
};

/**
 * Get update configuration from environment or defaults
 */
export function getUpdateConfig(): UpdateServerConfig {
  const config: UpdateServerConfig = { ...defaultUpdateConfig };

  // Override with environment variables if present
  if (Deno.env.get("UPDATE_SERVER_URL")) {
    config.serverUrl = Deno.env.get("UPDATE_SERVER_URL")!;
  }

  if (Deno.env.get("UPDATE_API_KEY")) {
    config.apiKey = Deno.env.get("UPDATE_API_KEY");
  }

  if (Deno.env.get("UPDATE_CHECK_INTERVAL")) {
    config.checkInterval = parseInt(Deno.env.get("UPDATE_CHECK_INTERVAL")!);
  }

  if (Deno.env.get("UPDATE_AUTO_DOWNLOAD")) {
    config.autoDownload = Deno.env.get("UPDATE_AUTO_DOWNLOAD") === "true";
  }

  if (Deno.env.get("UPDATE_AUTO_INSTALL")) {
    config.autoInstall = Deno.env.get("UPDATE_AUTO_INSTALL") === "true";
  }

  if (Deno.env.get("UPDATE_ALLOW_PRERELEASE")) {
    config.allowPrerelease = Deno.env.get("UPDATE_ALLOW_PRERELEASE") === "true";
  }

  if (Deno.env.get("UPDATE_NOTIFY_EMAIL")) {
    config.notifyEmail = Deno.env.get("UPDATE_NOTIFY_EMAIL");
  }

  return config;
}

/**
 * Current system version
 */
export const SYSTEM_VERSION = "1.0.0";

/**
 * Update check endpoints
 */
export const UPDATE_ENDPOINTS = {
  CHECK: "/check",
  DOWNLOAD: "/download",
  NEWS: "/news",
  CHANGELOG: "/changelog",
} as const;
