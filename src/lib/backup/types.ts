/**
 * Backup and Restore System Types
 */

export type BackupType = "full" | "database" | "media" | "config";
export type BackupStatus = "pending" | "in_progress" | "completed" | "failed";
export type BackupStorageProvider = "local" | "s3";

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  retention: number; // Days to keep backups
  storageProvider: BackupStorageProvider;
  includeMedia: boolean;
  includeDatabase: boolean;
  includeConfig: boolean;
  compression: boolean;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
  // Local storage
  localPath: string;
  // S3 storage (optional)
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3Prefix?: string;
}

export interface BackupMetadata {
  id?: number;
  filename: string;
  type: BackupType;
  size: number; // bytes
  status: BackupStatus;
  storageProvider: BackupStorageProvider;
  storagePath: string;
  compressed: boolean;
  includesMedia: boolean;
  includesDatabase: boolean;
  includesConfig: boolean;
  checksum: string; // SHA-256
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  createdBy?: number; // User ID
  createdAt: Date;
}

export interface CreateBackupOptions {
  type?: BackupType;
  includeMedia?: boolean;
  includeDatabase?: boolean;
  includeConfig?: boolean;
  compression?: boolean;
  storageProvider?: BackupStorageProvider;
  notifyUser?: boolean;
}

export interface RestoreOptions {
  backupId?: number;
  backupPath?: string;
  restoreDatabase?: boolean;
  restoreMedia?: boolean;
  restoreConfig?: boolean;
  confirmOverwrite?: boolean;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number; // bytes
  lastBackup?: Date;
  nextScheduledBackup?: Date;
  successfulBackups: number;
  failedBackups: number;
  oldestBackup?: Date;
  byType: Record<BackupType, number>;
  byStatus: Record<BackupStatus, number>;
}

export interface BackupListFilter {
  type?: BackupType;
  status?: BackupStatus;
  storageProvider?: BackupStorageProvider;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface BackupVerificationResult {
  valid: boolean;
  checksumMatch: boolean;
  fileExists: boolean;
  canRead: boolean;
  errors: string[];
}
