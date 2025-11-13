/**
 * System Updates Module - Types
 * Types and interfaces for system updates from central server
 */

/**
 * Update severity levels
 */
export type UpdateSeverity = "critical" | "high" | "medium" | "low" | "info";

/**
 * Update types
 */
export type UpdateType =
  | "security"
  | "feature"
  | "bugfix"
  | "performance"
  | "documentation"
  | "maintenance";

/**
 * Update status
 */
export type UpdateStatus = "pending" | "downloaded" | "installed" | "failed" | "skipped";

/**
 * System update from central server
 */
export interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  type: UpdateType;
  severity: UpdateSeverity;
  releaseDate: string;

  // Security information
  isCritical: boolean;
  cveIds?: string[]; // CVE identifiers if security-related

  // Requirements
  minVersion?: string;
  maxVersion?: string;
  requiredDependencies?: string[];

  // Update content
  downloadUrl?: string;
  checksum?: string;
  checksumAlgorithm?: "sha256" | "sha512";
  size?: number; // bytes

  // Migration and scripts
  migrationScript?: string;
  rollbackScript?: string;

  // Metadata
  changelog?: string[];
  breakingChanges?: string[];
  documentation?: string;
  author?: string;

  // Installation flags
  requiresBackup: boolean;
  requiresRestart: boolean;
  autoInstall: boolean;
}

/**
 * News item from central server
 */
export interface SystemNews {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: "announcement" | "security" | "tips" | "community" | "general";
  publishDate: string;
  expiryDate?: string;
  priority: "high" | "medium" | "low";
  imageUrl?: string;
  links?: Array<{
    text: string;
    url: string;
  }>;
  tags?: string[];
}

/**
 * Update server configuration
 */
export interface UpdateServerConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey?: string;
  checkInterval: number; // minutes
  autoDownload: boolean;
  autoInstall: boolean;
  allowPrerelease: boolean;

  // Security settings
  verifyChecksum: boolean;
  verifySignature: boolean;
  requireHttps: boolean;
  trustedCertificates?: string[];

  // Proxy settings
  proxyUrl?: string;
  proxyAuth?: {
    username: string;
    password: string;
  };

  // Notification settings
  notifyOnUpdate: boolean;
  notifyEmail?: string;

  // Backup settings
  autoBackupBeforeUpdate: boolean;
  keepBackupDays: number;
}

/**
 * Update check result
 */
export interface UpdateCheckResult {
  hasUpdates: boolean;
  currentVersion: string;
  latestVersion: string;
  updates: SystemUpdate[];
  news: SystemNews[];
  lastChecked: Date;
  nextCheck?: Date;
}

/**
 * Update installation result
 */
export interface UpdateInstallResult {
  success: boolean;
  updateId: string;
  version: string;
  installedAt: Date;
  error?: string;
  backupId?: string;
  logs?: string[];
  rollbackAvailable: boolean;
}

/**
 * Update history entry
 */
export interface UpdateHistoryEntry {
  id: number;
  updateId: string;
  version: string;
  type: UpdateType;
  status: UpdateStatus;
  installedAt?: Date;
  installedBy?: number; // user ID
  error?: string;
  backupId?: string;
  rollbackAvailable: boolean;
  duration?: number; // milliseconds
}
