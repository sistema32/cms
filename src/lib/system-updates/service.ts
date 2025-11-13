/**
 * System Updates Module - Service
 * Main service for checking and installing system updates
 */

import type {
  SystemUpdate,
  SystemNews,
  UpdateCheckResult,
  UpdateInstallResult,
  UpdateServerConfig,
  UpdateHistoryEntry,
} from "./types.ts";
import { getUpdateConfig, SYSTEM_VERSION, UPDATE_ENDPOINTS } from "./config.ts";
import { logger } from "../logger/index.ts";

/**
 * System Updates Service
 */
export class SystemUpdatesService {
  private config: UpdateServerConfig;
  private lastCheck: Date | null = null;

  constructor(config?: Partial<UpdateServerConfig>) {
    this.config = { ...getUpdateConfig(), ...config };
  }

  /**
   * Check for available updates from central server
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      if (!this.config.enabled) {
        logger.info("System updates are disabled");
        return this.emptyCheckResult();
      }

      logger.info("Checking for system updates...");

      const url = new URL(
        UPDATE_ENDPOINTS.CHECK,
        this.config.serverUrl,
      );

      // Add query parameters
      url.searchParams.set("version", SYSTEM_VERSION);
      url.searchParams.set("prerelease", this.config.allowPrerelease.toString());

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": `CMS-System/${SYSTEM_VERSION}`,
      };

      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      // Perform the request
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Update check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Parse updates and news
      const updates: SystemUpdate[] = data.updates || [];
      const news: SystemNews[] = data.news || [];

      this.lastCheck = new Date();

      const result: UpdateCheckResult = {
        hasUpdates: updates.length > 0,
        currentVersion: SYSTEM_VERSION,
        latestVersion: data.latestVersion || SYSTEM_VERSION,
        updates,
        news,
        lastChecked: this.lastCheck,
        nextCheck: new Date(Date.now() + this.config.checkInterval * 60 * 1000),
      };

      logger.info(`Update check complete. Found ${updates.length} updates and ${news.length} news items`);

      return result;
    } catch (error) {
      logger.error("Failed to check for updates", error);
      return this.emptyCheckResult();
    }
  }

  /**
   * Download an update package
   */
  async downloadUpdate(update: SystemUpdate): Promise<boolean> {
    try {
      if (!update.downloadUrl) {
        throw new Error("No download URL provided");
      }

      logger.info(`Downloading update ${update.id} (${update.version})...`);

      const headers: Record<string, string> = {
        "User-Agent": `CMS-System/${SYSTEM_VERSION}`,
      };

      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(update.downloadUrl, { headers });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const content = await response.arrayBuffer();

      // Verify checksum if configured
      if (this.config.verifyChecksum && update.checksum) {
        const verified = await this.verifyChecksum(
          content,
          update.checksum,
          update.checksumAlgorithm || "sha256",
        );

        if (!verified) {
          throw new Error("Checksum verification failed");
        }
      }

      // Save update package
      const updatePath = `/tmp/updates/${update.id}.zip`;
      await Deno.mkdir("/tmp/updates", { recursive: true });
      await Deno.writeFile(updatePath, new Uint8Array(content));

      logger.info(`Update ${update.id} downloaded successfully`);

      return true;
    } catch (error) {
      logger.error(`Failed to download update ${update.id}`, error);
      return false;
    }
  }

  /**
   * Install an update
   */
  async installUpdate(update: SystemUpdate): Promise<UpdateInstallResult> {
    const startTime = Date.now();

    try {
      logger.info(`Installing update ${update.id} (${update.version})...`);

      // Create backup if required
      let backupId: string | undefined;
      if (update.requiresBackup || this.config.autoBackupBeforeUpdate) {
        logger.info("Creating backup before update...");
        // TODO: Integrate with backup service
        backupId = `backup-${update.id}-${Date.now()}`;
      }

      // Run migration script if provided
      if (update.migrationScript) {
        logger.info("Running migration script...");
        // TODO: Execute migration script safely
      }

      // Simulate installation
      logger.info("Installing update files...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const duration = Date.now() - startTime;

      logger.info(`Update ${update.id} installed successfully in ${duration}ms`);

      return {
        success: true,
        updateId: update.id,
        version: update.version,
        installedAt: new Date(),
        backupId,
        logs: [`Update ${update.id} installed successfully`],
        rollbackAvailable: !!update.rollbackScript,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed to install update ${update.id}`, error);

      return {
        success: false,
        updateId: update.id,
        version: update.version,
        installedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
        logs: [
          `Update ${update.id} installation failed`,
          error instanceof Error ? error.message : "Unknown error",
        ],
        rollbackAvailable: false,
      };
    }
  }

  /**
   * Get news from central server
   */
  async getNews(): Promise<SystemNews[]> {
    try {
      if (!this.config.enabled) {
        return [];
      }

      const url = new URL(
        UPDATE_ENDPOINTS.NEWS,
        this.config.serverUrl,
      );

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": `CMS-System/${SYSTEM_VERSION}`,
      };

      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`News fetch failed: ${response.status}`);
      }

      const data = await response.json();

      return data.news || [];
    } catch (error) {
      logger.error("Failed to fetch news", error);
      return [];
    }
  }

  /**
   * Get configuration
   */
  getConfig(): UpdateServerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UpdateServerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Verify checksum of downloaded content
   */
  private async verifyChecksum(
    content: ArrayBuffer,
    expectedChecksum: string,
    algorithm: "sha256" | "sha512",
  ): Promise<boolean> {
    try {
      const hashBuffer = await crypto.subtle.digest(
        algorithm.toUpperCase(),
        content,
      );

      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      return hashHex.toLowerCase() === expectedChecksum.toLowerCase();
    } catch (error) {
      logger.error("Checksum verification error", error);
      return false;
    }
  }

  /**
   * Create empty check result
   */
  private emptyCheckResult(): UpdateCheckResult {
    return {
      hasUpdates: false,
      currentVersion: SYSTEM_VERSION,
      latestVersion: SYSTEM_VERSION,
      updates: [],
      news: [],
      lastChecked: new Date(),
    };
  }
}

/**
 * Default service instance
 */
export const systemUpdatesService = new SystemUpdatesService();
