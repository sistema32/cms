import type { Context } from "hono";
import { securitySettingsService } from "../../services/security/securitySettingsService.ts";
import { AppError } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { createLogger } from "@/platform/logger.ts";
import { z } from "zod";

const log = createLogger("securitySettingsController");
const updateSettingSchema = z.object({
    key: z.string().min(1),
    value: z.any(),
});

export class SecuritySettingsController {
    /**
     * Get all security settings
     */
    async getSettings(c: Context) {
        try {
            const settings = await securitySettingsService.getSettingsObject();
            return c.json({ success: true, data: settings });
        } catch (error) {
            log.error("Error fetching security settings", error instanceof Error ? error : undefined);
            throw new AppError("security_settings_fetch_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Update a security setting
     */
    async updateSetting(c: Context) {
        try {
            const body = await c.req.json();
            const { key, value } = updateSettingSchema.parse(body);

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
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }
            log.error("Error updating security setting", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_setting_update_failed", getErrorMessage(error), 500);
        }
    }
}

export const securitySettingsController = new SecuritySettingsController();
