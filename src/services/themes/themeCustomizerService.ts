// @ts-nocheck
/**
 * Theme Customizer Service
 * Manages visual theme customization with live preview, undo/redo, and autosave
 */

import { db } from "@/config/db.ts";
import { settings } from "@/db/schema.ts";
import { eq } from "drizzle-orm";

export interface CustomizerChange {
  id: string;
  timestamp: Date;
  settingKey: string;
  oldValue: any;
  newValue: any;
  description: string;
}

export interface CustomizerSession {
  id: string;
  userId: number;
  theme: string;
  changes: CustomizerChange[];
  currentIndex: number;
  isDraft: boolean;
  lastSaved: Date;
  createdAt: Date;
}

export interface CustomizerState {
  settings: Record<string, any>;
  pendingChanges: number;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Theme Customizer Service
 * Manages customization sessions with undo/redo functionality
 */
class ThemeCustomizerService {
  private sessions = new Map<string, CustomizerSession>();
  private readonly MAX_HISTORY = 50;
  private readonly AUTOSAVE_INTERVAL = 30000; // 30 seconds
  private autosaveTimers = new Map<string, number>();

  /**
   * Create a new customizer session
   */
  async createSession(userId: number, theme: string): Promise<CustomizerSession> {
    const sessionId = crypto.randomUUID();

    // Load current theme settings
    const currentSettings = await this.loadThemeSettings(theme);

    const session: CustomizerSession = {
      id: sessionId,
      userId,
      theme,
      changes: [],
      currentIndex: -1,
      isDraft: true,
      lastSaved: new Date(),
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Start autosave timer
    this.startAutosave(sessionId);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): CustomizerSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * End a customizer session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Stop autosave
    this.stopAutosave(sessionId);

    // Remove session
    this.sessions.delete(sessionId);
  }

  /**
   * Apply a change to a setting
   */
  async applyChange(
    sessionId: string,
    settingKey: string,
    newValue: any,
    description?: string
  ): Promise<CustomizerState> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Get current value
    const oldValue = await this.getSettingValue(settingKey);

    // Create change record
    const change: CustomizerChange = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      settingKey,
      oldValue,
      newValue,
      description: description || `Changed ${settingKey}`,
    };

    // Remove any changes after current index (for redo functionality)
    if (session.currentIndex < session.changes.length - 1) {
      session.changes = session.changes.slice(0, session.currentIndex + 1);
    }

    // Add new change
    session.changes.push(change);
    session.currentIndex++;

    // Limit history size
    if (session.changes.length > this.MAX_HISTORY) {
      const toRemove = session.changes.length - this.MAX_HISTORY;
      session.changes = session.changes.slice(toRemove);
      session.currentIndex -= toRemove;
    }

    // Mark as draft
    session.isDraft = true;

    // Apply change to temporary settings (in-memory)
    await this.updateSetting(settingKey, newValue, true);

    return this.getState(sessionId);
  }

  /**
   * Undo last change
   */
  async undo(sessionId: string): Promise<CustomizerState> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.currentIndex < 0) {
      throw new Error("Nothing to undo");
    }

    // Get change to undo
    const change = session.changes[session.currentIndex];

    // Revert to old value
    await this.updateSetting(change.settingKey, change.oldValue, true);

    // Move index back
    session.currentIndex--;

    return this.getState(sessionId);
  }

  /**
   * Redo last undone change
   */
  async redo(sessionId: string): Promise<CustomizerState> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.currentIndex >= session.changes.length - 1) {
      throw new Error("Nothing to redo");
    }

    // Move index forward
    session.currentIndex++;

    // Get change to redo
    const change = session.changes[session.currentIndex];

    // Apply new value
    await this.updateSetting(change.settingKey, change.newValue, true);

    return this.getState(sessionId);
  }

  /**
   * Reset all changes
   */
  async reset(sessionId: string): Promise<CustomizerState> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Revert all changes
    for (let i = session.currentIndex; i >= 0; i--) {
      const change = session.changes[i];
      await this.updateSetting(change.settingKey, change.oldValue, true);
    }

    // Clear history
    session.changes = [];
    session.currentIndex = -1;
    session.isDraft = false;

    return this.getState(sessionId);
  }

  /**
   * Save changes as draft
   */
  async saveDraft(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Save draft to database with a special key
    const draftKey = `_customizer_draft_${session.theme}_${session.userId}`;
    const draftData = {
      changes: session.changes,
      currentIndex: session.currentIndex,
      timestamp: new Date(),
    };

    await this.updateSetting(draftKey, JSON.stringify(draftData), false);

    session.lastSaved = new Date();
    session.isDraft = false;
  }

  /**
   * Publish changes (apply permanently)
   */
  async publish(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Apply all changes up to current index
    for (let i = 0; i <= session.currentIndex; i++) {
      const change = session.changes[i];
      await this.updateSetting(change.settingKey, change.newValue, false);
    }

    // Clear draft
    const draftKey = `_customizer_draft_${session.theme}_${session.userId}`;
    await this.deleteSetting(draftKey);

    session.isDraft = false;
    session.lastSaved = new Date();
  }

  /**
   * Load draft for a theme
   */
  async loadDraft(userId: number, theme: string): Promise<CustomizerChange[] | null> {
    const draftKey = `_customizer_draft_${theme}_${userId}`;
    const draftValue = await this.getSettingValue(draftKey);

    if (!draftValue) return null;

    try {
      const draftData = JSON.parse(draftValue);
      return draftData.changes || [];
    } catch {
      return null;
    }
  }

  /**
   * Get current state
   */
  async getState(sessionId: string): Promise<CustomizerState> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Load current settings
    const currentSettings = await this.loadThemeSettings(session.theme);

    return {
      settings: currentSettings,
      pendingChanges: session.currentIndex + 1,
      canUndo: session.currentIndex >= 0,
      canRedo: session.currentIndex < session.changes.length - 1,
    };
  }

  /**
   * Get change history
   */
  getHistory(sessionId: string): CustomizerChange[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    return session.changes.slice(0, session.currentIndex + 1);
  }

  // Helper methods

  private async loadThemeSettings(theme: string): Promise<Record<string, any>> {
    const settingsData: Record<string, any> = {};

    const allSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.key, `theme_${theme}_settings`));

    if (allSettings.length > 0) {
      try {
        const parsed = JSON.parse(allSettings[0].value || "{}");
        Object.assign(settingsData, parsed);
      } catch {
        // Ignore parse errors
      }
    }

    return settingsData;
  }

  private async getSettingValue(key: string): Promise<any> {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (result.length === 0) return null;

    try {
      return JSON.parse(result[0].value || "null");
    } catch {
      return result[0].value;
    }
  }

  private async updateSetting(key: string, value: any, isTemp: boolean): Promise<void> {
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);

    // Check if setting exists
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(settings)
        .set({ value: valueStr, updatedAt: new Date() })
        .where(eq(settings.key, key));
    } else {
      // Insert
      await db.insert(settings).values({
        key,
        value: valueStr,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  private async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }

  private startAutosave(sessionId: string): void {
    const timer = setInterval(() => {
      const session = this.sessions.get(sessionId);
      if (session && session.isDraft) {
        this.saveDraft(sessionId).catch((err) => {
          console.error("Autosave failed:", err);
        });
      }
    }, this.AUTOSAVE_INTERVAL);

    this.autosaveTimers.set(sessionId, timer as unknown as number);
  }

  private stopAutosave(sessionId: string): void {
    const timer = this.autosaveTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.autosaveTimers.delete(sessionId);
    }
  }
}

// Export singleton instance
export const themeCustomizerService = new ThemeCustomizerService();

/**
 * Color utilities for color picker
 */
export const ColorUtils = {
  /**
   * Convert hex to RGB
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  },

  /**
   * Lighten color
   */
  lighten(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const amount = Math.round(255 * percent);
    const r = Math.min(255, rgb.r + amount);
    const g = Math.min(255, rgb.g + amount);
    const b = Math.min(255, rgb.b + amount);

    return this.rgbToHex(r, g, b);
  },

  /**
   * Darken color
   */
  darken(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const amount = Math.round(255 * percent);
    const r = Math.max(0, rgb.r - amount);
    const g = Math.max(0, rgb.g - amount);
    const b = Math.max(0, rgb.b - amount);

    return this.rgbToHex(r, g, b);
  },

  /**
   * Get contrast color (black or white)
   */
  getContrastColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return "#000000";

    // Calculate luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

    return luminance > 0.5 ? "#000000" : "#ffffff";
  },
};
