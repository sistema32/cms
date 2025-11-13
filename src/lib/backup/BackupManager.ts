/**
 * Backup Manager
 * Handles creation, scheduling, and management of backups
 */

import { db } from "../../config/db.ts";
import { backups } from "../../db/schema.ts";
import type { NewBackup } from "../../db/schema.ts";
import { eq, desc, and, lte, gte } from "drizzle-orm";
import { env } from "../../config/env.ts";
import { webhookManager } from "../webhooks/index.ts";
import { notificationService } from "../email/index.ts";
import type {
  BackupConfig,
  BackupMetadata,
  BackupStats,
  BackupType,
  CreateBackupOptions,
  RestoreOptions,
  BackupListFilter,
  BackupVerificationResult,
} from "./types.ts";
import { gzip, gunzip } from "compress/gzip";

/**
 * Converts an ArrayBuffer to a hexadecimal string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class BackupManager {
  private static instance: BackupManager;
  private config: BackupConfig;
  private schedulerInterval?: number;

  private constructor() {
    this.config = this.loadConfig();
    if (this.config.enabled) {
      this.startScheduler();
    }
  }

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  /**
   * Load backup configuration from environment
   */
  private loadConfig(): BackupConfig {
    return {
      enabled: env.BACKUP_ENABLED,
      schedule: env.BACKUP_SCHEDULE,
      retention: env.BACKUP_RETENTION_DAYS,
      storageProvider: env.BACKUP_STORAGE_PROVIDER,
      includeMedia: env.BACKUP_INCLUDE_UPLOADS,
      includeDatabase: true, // Always include database
      includeConfig: true, // Always include config
      compression: env.BACKUP_COMPRESS,
      notifyOnComplete: false,
      notifyOnError: false,
      localPath: env.BACKUP_LOCAL_PATH,
      s3Bucket: env.BACKUP_S3_BUCKET,
      s3Region: env.BACKUP_S3_REGION,
      s3AccessKey: env.BACKUP_S3_ACCESS_KEY,
      s3SecretKey: env.BACKUP_S3_SECRET_KEY,
      s3Prefix: env.BACKUP_S3_ENDPOINT || "backups/",
    };
  }

  /**
   * Create a backup
   */
  async createBackup(options: CreateBackupOptions = {}, userId?: number): Promise<number> {
    const type = options.type || "full";
    const includesMedia = options.includeMedia ?? this.config.includeMedia;
    const includesDatabase = options.includeDatabase ?? this.config.includeDatabase;
    const includesConfig = options.includeConfig ?? this.config.includeConfig;
    const compression = options.compression ?? this.config.compression;
    const storageProvider = options.storageProvider || this.config.storageProvider;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `lexcms-${type}-${timestamp}.${compression ? "tar.gz" : "tar"}`;
    const startedAt = new Date();

    console.log(`📦 Starting backup: ${filename}`);

    // Create backup record
    const [backup] = await db.insert(backups).values({
      filename,
      type,
      size: 0, // Will update after creation
      status: "in_progress",
      storageProvider,
      storagePath: "",
      compressed: compression,
      includesMedia,
      includesDatabase,
      includesConfig,
      checksum: "",
      startedAt,
      createdBy: userId,
    }).returning();

    try {
      // Ensure backup directory exists
      await this.ensureBackupDir();

      // Create backup contents
      const backupPath = await this.createBackupArchive(
        backup.id,
        type,
        includesDatabase,
        includesMedia,
        includesConfig,
        compression,
      );

      // Calculate checksum
      const checksum = await this.calculateChecksum(backupPath);

      // Get file size
      const fileInfo = await Deno.stat(backupPath);

      // Update backup record
      await db.update(backups)
        .set({
          storagePath: backupPath,
          size: Number(fileInfo.size),
          checksum,
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(backups.id, backup.id));

      console.log(`✅ Backup completed: ${filename} (${this.formatBytes(fileInfo.size)})`);

      // Send notifications
      if (options.notifyUser || this.config.notifyOnComplete) {
        await this.sendBackupNotification(backup.id, "completed", userId);
      }

      // Dispatch webhook
      try {
        await webhookManager.dispatch("system.backup_completed", {
          backupId: backup.id,
          filename,
          size: fileInfo.size,
          type,
          completedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn("Failed to dispatch backup webhook:", error);
      }

      // Clean old backups
      await this.cleanOldBackups();

      return backup.id;
    } catch (error) {
      console.error("Backup failed:", error);

      // Update backup record with error
      await db.update(backups)
        .set({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(backups.id, backup.id));

      // Send error notification
      if (this.config.notifyOnError) {
        await this.sendBackupNotification(backup.id, "failed", userId, error instanceof Error ? error.message : undefined);
      }

      throw error;
    }
  }

  /**
   * Create backup archive
   */
  private async createBackupArchive(
    backupId: number,
    type: BackupType,
    includeDatabase: boolean,
    includeMedia: boolean,
    includeConfig: boolean,
    compression: boolean,
  ): Promise<string> {
    const tempDir = `${this.config.localPath}/temp-${backupId}`;
    await Deno.mkdir(tempDir, { recursive: true });

    try {
      // Backup database
      if (includeDatabase && (type === "full" || type === "database")) {
        await this.backupDatabase(tempDir);
      }

      // Backup media
      if (includeMedia && (type === "full" || type === "media")) {
        await this.backupMedia(tempDir);
      }

      // Backup config
      if (includeConfig && (type === "full" || type === "config")) {
        await this.backupConfig(tempDir);
      }

      // Create tar archive
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const archiveName = `lexcms-${type}-${timestamp}.tar`;
      const archivePath = `${this.config.localPath}/${archiveName}`;

      await this.createTar(tempDir, archivePath);

      // Compress if requested
      if (compression) {
        const compressedPath = `${archivePath}.gz`;
        await this.compressFile(archivePath, compressedPath);
        await Deno.remove(archivePath);
        return compressedPath;
      }

      return archivePath;
    } finally {
      // Clean up temp directory
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch (error) {
        console.warn("Failed to clean temp directory:", error);
      }
    }
  }

  /**
   * Backup database
   */
  private async backupDatabase(targetDir: string): Promise<void> {
    // Convert DATABASE_URL to file path (remove file: prefix if present)
    let dbPath = env.DATABASE_URL;
    if (dbPath.startsWith("file:")) {
      dbPath = dbPath.replace(/^file:/, "");
    }

    const dbBackupPath = `${targetDir}/database.db`;

    // Check if database file exists
    try {
      await Deno.stat(dbPath);
    } catch (error) {
      throw new Error(`Database file not found at: ${dbPath}. Please ensure the database exists before creating a backup.`);
    }

    // Copy database file
    await Deno.copyFile(dbPath, dbBackupPath);

    // Also backup WAL and SHM files if they exist
    try {
      await Deno.copyFile(`${dbPath}-wal`, `${dbBackupPath}-wal`);
    } catch {
      // WAL file might not exist
    }

    try {
      await Deno.copyFile(`${dbPath}-shm`, `${dbBackupPath}-shm`);
    } catch {
      // SHM file might not exist
    }

    console.log("  ✓ Database backed up");
  }

  /**
   * Backup media files
   */
  private async backupMedia(targetDir: string): Promise<void> {
    const mediaDir = Deno.env.get("UPLOAD_DIR") || "./uploads";
    const mediaBackupDir = `${targetDir}/media`;

    try {
      await this.copyDirectory(mediaDir, mediaBackupDir);
      console.log("  ✓ Media files backed up");
    } catch (error) {
      console.warn("  ⚠ Media backup failed:", error);
    }
  }

  /**
   * Backup configuration files
   */
  private async backupConfig(targetDir: string): Promise<void> {
    const configBackupDir = `${targetDir}/config`;
    await Deno.mkdir(configBackupDir, { recursive: true });

    // Backup .env file (without secrets)
    try {
      const envContent = await Deno.readTextFile(".env");
      // Remove sensitive values
      const sanitizedEnv = envContent
        .split("\n")
        .map((line) => {
          if (line.includes("SECRET") || line.includes("PASSWORD") || line.includes("KEY")) {
            const [key] = line.split("=");
            return `${key}=***REDACTED***`;
          }
          return line;
        })
        .join("\n");

      await Deno.writeTextFile(`${configBackupDir}/.env.example`, sanitizedEnv);
    } catch (error) {
      console.warn("  ⚠ .env backup failed:", error);
    }

    // Backup package.json
    try {
      await Deno.copyFile("deno.json", `${configBackupDir}/deno.json`);
    } catch {
      // File might not exist
    }

    console.log("  ✓ Config files backed up");
  }

  /**
   * Create tar archive using Deno command
   */
  private async createTar(sourceDir: string, targetPath: string): Promise<void> {
    const command = new Deno.Command("tar", {
      args: ["-cf", targetPath, "-C", sourceDir, "."],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stderr } = await command.output();

    if (!success) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`Failed to create tar archive: ${errorText}`);
    }
  }

  /**
   * Compress file using gzip
   */
  private async compressFile(sourcePath: string, targetPath: string): Promise<void> {
    const data = await Deno.readFile(sourcePath);
    const compressed = gzip(data);
    await Deno.writeFile(targetPath, compressed);
  }

  /**
   * Calculate SHA-256 checksum
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const data = await Deno.readFile(filePath);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return bufferToHex(hashBuffer);
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(source: string, destination: string): Promise<void> {
    await Deno.mkdir(destination, { recursive: true });

    for await (const entry of Deno.readDir(source)) {
      const sourcePath = `${source}/${entry.name}`;
      const destPath = `${destination}/${entry.name}`;

      if (entry.isDirectory) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await Deno.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDir(): Promise<void> {
    try {
      await Deno.mkdir(this.config.localPath, { recursive: true });
    } catch (error) {
      console.warn("Failed to create backup directory:", error);
    }
  }

  /**
   * Initialize all required directories for the application
   */
  async initializeDirectories(): Promise<void> {
    const directories = [
      this.config.localPath, // ./backups
      Deno.env.get("UPLOAD_DIR") || "./uploads",
    ];

    // Also create data directory if using SQLite
    if (env.DATABASE_URL.includes("sqlite") || env.DATABASE_URL.includes("file:")) {
      let dbPath = env.DATABASE_URL;
      if (dbPath.startsWith("file:")) {
        dbPath = dbPath.replace(/^file:/, "");
      }

      // Extract directory path from database file path
      const dbDir = dbPath.substring(0, dbPath.lastIndexOf("/"));
      if (dbDir) {
        directories.push(dbDir);
      }
    }

    for (const dir of directories) {
      try {
        await Deno.mkdir(dir, { recursive: true });
        console.log(`✓ Directory ensured: ${dir}`);
      } catch (error) {
        console.warn(`⚠ Failed to create directory ${dir}:`, error);
      }
    }
  }

  /**
   * Clean old backups based on retention policy
   */
  private async cleanOldBackups(): Promise<void> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.config.retention);

    const oldBackups = await db.query.backups.findMany({
      where: and(
        eq(backups.status, "completed"),
        lte(backups.createdAt, retentionDate),
      ),
    });

    for (const backup of oldBackups) {
      try {
        // Delete file
        await Deno.remove(backup.storagePath);

        // Delete record
        await db.delete(backups).where(eq(backups.id, backup.id));

        console.log(`🗑️ Deleted old backup: ${backup.filename}`);
      } catch (error) {
        console.warn(`Failed to delete backup ${backup.filename}:`, error);
      }
    }
  }

  /**
   * Start backup scheduler
   */
  private startScheduler(): void {
    // For simplicity, check every hour if a backup is needed
    // In production, use a proper cron parser
    this.schedulerInterval = setInterval(async () => {
      await this.checkScheduledBackup();
    }, 3600000); // Every hour

    console.log("📅 Backup scheduler started");
  }

  /**
   * Check if scheduled backup is needed
   */
  private async checkScheduledBackup(): Promise<void> {
    const lastBackup = await db.query.backups.findFirst({
      where: eq(backups.status, "completed"),
      orderBy: [desc(backups.createdAt)],
    });

    if (!lastBackup) {
      // No backups yet, create one
      await this.createBackup();
      return;
    }

    // Check if 24 hours have passed (simple daily backup)
    const hoursSinceLastBackup = (Date.now() - lastBackup.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastBackup >= 24) {
      console.log("⏰ Scheduled backup triggered");
      await this.createBackup();
    }
  }

  /**
   * Stop scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      console.log("📅 Backup scheduler stopped");
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(options: RestoreOptions): Promise<void> {
    // This is a critical operation - implement with caution
    console.log("🔄 Starting restore...");

    throw new Error("Restore functionality not yet implemented - requires careful planning");
  }

  /**
   * Get backup list
   */
  async getBackups(filter: BackupListFilter = {}): Promise<BackupMetadata[]> {
    const conditions = [];

    if (filter.type) {
      conditions.push(eq(backups.type, filter.type));
    }

    if (filter.status) {
      conditions.push(eq(backups.status, filter.status));
    }

    if (filter.storageProvider) {
      conditions.push(eq(backups.storageProvider, filter.storageProvider));
    }

    if (filter.startDate) {
      conditions.push(gte(backups.createdAt, filter.startDate));
    }

    if (filter.endDate) {
      conditions.push(lte(backups.createdAt, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.query.backups.findMany({
      where: whereClause,
      orderBy: [desc(backups.createdAt)],
      limit: filter.limit || 50,
      offset: filter.offset || 0,
    });

    return results as BackupMetadata[];
  }

  /**
   * Get backup statistics
   */
  async getStats(): Promise<BackupStats> {
    const allBackups = await db.select().from(backups);

    const lastBackup = await db.query.backups.findFirst({
      where: eq(backups.status, "completed"),
      orderBy: [desc(backups.createdAt)],
    });

    const oldestBackup = await db.query.backups.findFirst({
      where: eq(backups.status, "completed"),
      orderBy: [backups.createdAt],
    });

    return {
      totalBackups: allBackups.length,
      totalSize: allBackups.reduce((sum, b) => sum + b.size, 0),
      lastBackup: lastBackup?.createdAt,
      nextScheduledBackup: this.getNextScheduledBackup(),
      successfulBackups: allBackups.filter((b) => b.status === "completed").length,
      failedBackups: allBackups.filter((b) => b.status === "failed").length,
      oldestBackup: oldestBackup?.createdAt,
      byType: allBackups.reduce((acc, b) => {
        acc[b.type as BackupType] = (acc[b.type as BackupType] || 0) + 1;
        return acc;
      }, {} as Record<BackupType, number>),
      byStatus: allBackups.reduce((acc, b) => {
        acc[b.status as any] = (acc[b.status as any] || 0) + 1;
        return acc;
      }, {} as any),
    };
  }

  /**
   * Get next scheduled backup time
   */
  private getNextScheduledBackup(): Date | undefined {
    if (!this.config.enabled) {
      return undefined;
    }

    // Simple implementation: next day at 2 AM
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);

    return next;
  }

  /**
   * Send backup notification
   */
  private async sendBackupNotification(
    backupId: number,
    status: "completed" | "failed",
    userId?: number,
    errorMessage?: string,
  ): Promise<void> {
    if (!userId) {
      // Get admin users
      const adminUsers = await db.query.users.findMany({
        where: (users, { eq }) => eq(users.roleId, 1), // Assuming role 1 is admin
        limit: 5,
      });

      for (const admin of adminUsers) {
        await this.createBackupNotification(backupId, status, admin.id, errorMessage);
      }
    } else {
      await this.createBackupNotification(backupId, status, userId, errorMessage);
    }
  }

  /**
   * Create backup notification
   */
  private async createBackupNotification(
    backupId: number,
    status: "completed" | "failed",
    userId: number,
    errorMessage?: string,
  ): Promise<void> {
    const backup = await db.query.backups.findFirst({
      where: eq(backups.id, backupId),
    });

    if (!backup) return;

    const title = status === "completed"
      ? "Backup completed successfully"
      : "Backup failed";

    const message = status === "completed"
      ? `Backup ${backup.filename} completed (${this.formatBytes(backup.size)})`
      : `Backup ${backup.filename} failed: ${errorMessage || "Unknown error"}`;

    try {
      await notificationService.create({
        userId,
        type: status === "completed" ? "system.backup_completed" : "system.error",
        title,
        message,
        icon: status === "completed" ? "✅" : "❌",
        priority: status === "completed" ? "low" : "high",
        sendEmail: status === "failed",
        data: {
          backupId,
          filename: backup.filename,
          size: backup.size,
          status,
        },
      });
    } catch (error) {
      console.warn("Failed to create backup notification:", error);
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get backup by ID
   */
  async getBackupById(id: number): Promise<BackupMetadata | null> {
    const backup = await db.query.backups.findFirst({
      where: eq(backups.id, id),
    });

    return backup as BackupMetadata | null;
  }

  /**
   * Delete backup
   */
  async deleteBackup(id: number): Promise<void> {
    const backup = await this.getBackupById(id);

    if (!backup) {
      throw new Error("Backup not found");
    }

    // Delete file
    try {
      await Deno.remove(backup.storagePath);
    } catch (error) {
      console.warn("Failed to delete backup file:", error);
    }

    // Delete record
    await db.delete(backups).where(eq(backups.id, id));
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(id: number): Promise<BackupVerificationResult> {
    const backup = await this.getBackupById(id);

    if (!backup) {
      return {
        valid: false,
        checksumMatch: false,
        fileExists: false,
        canRead: false,
        errors: ["Backup not found"],
      };
    }

    const errors: string[] = [];
    let fileExists = false;
    let canRead = false;
    let checksumMatch = false;

    // Check if file exists
    try {
      await Deno.stat(backup.storagePath);
      fileExists = true;
    } catch {
      errors.push("Backup file does not exist");
    }

    // Check if file is readable
    if (fileExists) {
      try {
        await Deno.readFile(backup.storagePath);
        canRead = true;
      } catch {
        errors.push("Backup file is not readable");
      }
    }

    // Verify checksum
    if (fileExists && canRead) {
      try {
        const actualChecksum = await this.calculateChecksum(backup.storagePath);
        checksumMatch = actualChecksum === backup.checksum;

        if (!checksumMatch) {
          errors.push("Checksum mismatch - backup may be corrupted");
        }
      } catch (error) {
        errors.push(`Checksum verification failed: ${error}`);
      }
    }

    return {
      valid: fileExists && canRead && checksumMatch,
      checksumMatch,
      fileExists,
      canRead,
      errors,
    };
  }
}

// Export singleton instance
export const backupManager = BackupManager.getInstance();
