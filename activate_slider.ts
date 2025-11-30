
import { db } from "./src/config/db.ts";
import { plugins, pluginPermissionGrants, pluginHealth } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function main() {
    const plugin = await db.select().from(plugins).where(eq(plugins.name, "smart-slider-3")).get();
    if (plugin) {
        console.log("Found plugin:", plugin.name);

        // Activate
        if (plugin.status !== "active") {
            await db.update(plugins).set({ status: "active" }).where(eq(plugins.name, "smart-slider-3"));
            console.log("Activated.");
        }

        // Grant Permissions
        const permissions = [
            "db:read", "db:write", "fs:read",
            "route:GET:/sliders", "route:POST:/sliders",
            "route:GET:/sliders/:id", "route:PUT:/sliders/:id",
            "route:GET:/render/:id"
        ];

        for (const p of permissions) {
            await db.insert(pluginPermissionGrants).values({
                pluginId: plugin.id,
                permission: p,
                granted: true,
                grantedAt: new Date(),
            }).onConflictDoNothing();
        }
        console.log("Permissions granted.");

        // Reset Health
        await db.insert(pluginHealth).values({
            pluginId: plugin.id,
            status: "active",
            lastCheckedAt: new Date(),
            latencyMs: 0
        });
        console.log("Health reset.");

    } else {
        console.log("Plugin not found");
    }
}

main();
