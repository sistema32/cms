// @ts-nocheck
/**
 * Security Settings Service
 * Manages security configuration settings
 */

import { db } from "../../db/index.ts";
import { securitySettings } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { NewSecuritySetting, SecuritySetting } from "../../db/schema.ts";

export class SecuritySettingsService {
    /**
     * Get all settings
     */
    async getAllSettings(): Promise<SecuritySetting[]> {
        return await db.select()
            .from(securitySettings)
            .orderBy(securitySettings.category, securitySettings.key);
    }

    /**
     * Get settings by category
     */
    async getSettingsByCategory(category: string): Promise<SecuritySetting[]> {
        return await db.select()
            .from(securitySettings)
            .where(eq(securitySettings.category, category))
            .orderBy(securitySettings.key);
    }

    /**
     * Get setting by key
     */
    async getSetting(key: string): Promise<SecuritySetting | null> {
        const [setting] = await db.select()
            .from(securitySettings)
            .where(eq(securitySettings.key, key))
            .limit(1);

        return setting || null;
    }

    /**
     * Get setting value (parsed by type)
     */
    async getValue<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
        const setting = await this.getSetting(key);

        if (!setting) {
            return defaultValue;
        }

        return this.parseValue(setting.value, setting.type) as T;
    }

    /**
     * Set setting value
     */
    async setSetting(
        key: string,
        value: any,
        type: string = "string",
        category: string = "general",
        description?: string,
        updatedBy?: number
    ): Promise<SecuritySetting> {
        const stringValue = this.stringifyValue(value, type);
        const existing = await this.getSetting(key);

        if (existing) {
            const [updated] = await db.update(securitySettings)
                .set({
                    value: stringValue,
                    type,
                    category,
                    description,
                    updatedBy,
                    updatedAt: new Date(),
                })
                .where(eq(securitySettings.key, key))
                .returning();

            return updated;
        } else {
            const [created] = await db.insert(securitySettings)
                .values({
                    key,
                    value: stringValue,
                    type,
                    category,
                    description,
                    updatedBy,
                })
                .returning();

            return created;
        }
    }

    /**
     * Delete setting
     */
    async deleteSetting(key: string): Promise<void> {
        await db.delete(securitySettings).where(eq(securitySettings.key, key));
    }

    /**
     * Parse value based on type
     */
    private parseValue(value: string, type: string): any {
        switch (type) {
            case "number":
                return Number(value);
            case "boolean":
                return value === "true" || value === "1";
            case "json":
                try {
                    return JSON.parse(value);
                } catch {
                    return null;
                }
            default:
                return value;
        }
    }

    /**
     * Stringify value based on type
     */
    private stringifyValue(value: any, type: string): string {
        switch (type) {
            case "json":
                return JSON.stringify(value);
            case "boolean":
                return value ? "true" : "false";
            default:
                return String(value);
        }
    }

    /**
     * Get default security settings
     */
    async getDefaults(): Promise<Record<string, any>> {
        return {
            // Rate Limiting
            "rate_limit.global_max_requests": 100,
            "rate_limit.global_window_seconds": 60,
            "rate_limit.auto_block_threshold": 10,
            "rate_limit.auto_block_duration_hours": 24,

            // Security Headers
            "headers.csp_enabled": true,
            "headers.hsts_enabled": true,
            "headers.hsts_max_age": 31536000,
            "headers.x_frame_options": "SAMEORIGIN",
            "headers.x_content_type_options": "nosniff",

            // Notifications
            "notifications.email_enabled": false,
            "notifications.email_recipients": "[]",
            "notifications.webhook_enabled": false,
            "notifications.webhook_url": "",
            "notifications.critical_events_only": true,

            // Cleanup
            "cleanup.logs_retention_days": 90,
            "cleanup.auto_cleanup_enabled": true,
            "cleanup.cleanup_schedule": "0 2 * * *", // 2 AM daily
        };
    }

    /**
     * Initialize default settings
     */
    async initializeDefaults(updatedBy?: number): Promise<void> {
        const defaults = await this.getDefaults();

        for (const [key, value] of Object.entries(defaults)) {
            const existing = await this.getSetting(key);
            if (!existing) {
                const [category, ...rest] = key.split(".");
                const type = typeof value === "number" ? "number"
                    : typeof value === "boolean" ? "boolean"
                        : Array.isArray(value) || typeof value === "object" ? "json"
                            : "string";

                await this.setSetting(key, value, type, category, undefined, updatedBy);
            }
        }
    }

    /**
     * Get settings as key-value object
     */
    async getSettingsObject(category?: string): Promise<Record<string, any>> {
        const settings = category
            ? await this.getSettingsByCategory(category)
            : await this.getAllSettings();

        const obj: Record<string, any> = {};
        settings.forEach(s => {
            obj[s.key] = this.parseValue(s.value, s.type);
        });

        return obj;
    }
}

export const securitySettingsService = new SecuritySettingsService();
