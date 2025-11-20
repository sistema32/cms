import type { Context } from "hono";
import { securitySettingsService } from "../../services/security/securitySettingsService.ts";

export class SecuritySettingsController {
    /**
     * Get all security settings
     */
    async getSettings(c: Context) {
        try {
            const settings = await securitySettingsService.getSettingsObject();
            return c.json({ success: true, data: settings });
        } catch (error) {
            console.error("Error fetching security settings:", error);
            return c.json({ success: false, error: "Failed to fetch settings" }, 500);
        }
    }

    /**
     * Update a security setting
     */
    async updateSetting(c: Context) {
        try {
            const body = await c.req.json();
            const { key, value } = body;

            if (!key || value === undefined) {
                return c.json({ success: false, error: "Key and value are required" }, 400);
            }

            // Get existing setting to determine type and category
            const existing = await securitySettingsService.getSetting(key);

            // Determine type if not existing
            let type = "string";
            let category = "general";

            if (existing) {
                type = existing.type;
                category = existing.category;
            } else {
                // Infer type from value
                if (typeof value === "boolean") type = "boolean";
                else if (typeof value === "number") type = "number";
                else if (typeof value === "object") type = "json";

                // Infer category from key prefix
                if (key.startsWith("security.")) category = "security";
                else if (key.startsWith("rate_limit.")) category = "rate_limit";
            }

            const user = c.get("user");
            const updated = await securitySettingsService.setSetting(
                key,
                value,
                type,
                category,
                existing?.description || undefined,
                user?.userId
            );

            return c.json({ success: true, data: updated });
        } catch (error) {
            console.error("Error updating security setting:", error);
            return c.json({ success: false, error: "Failed to update setting" }, 500);
        }
    }
}

export const securitySettingsController = new SecuritySettingsController();
