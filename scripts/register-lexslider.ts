#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * LexSlider Plugin Registration Script
 * 
 * This script registers the LexSlider plugin in the database
 * Run this after installing the plugin.
 * 
 * Usage:
 *   deno run --allow-read --allow-write --allow-env scripts/register-lexslider.ts
 */

import { db } from "../src/db/index.ts";
import { plugins } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

async function registerPlugin() {
    console.log("🔄 Registering LexSlider plugin...\n");

    try {
        // Check if plugin already exists
        const existing = await db.select().from(plugins).where(eq(plugins.name, 'lexslider'));

        if (existing.length > 0) {
            console.log("⚠️  LexSlider plugin is already registered");
            console.log("   Plugin ID:", existing[0].id);
            console.log("   Status:", existing[0].isActive ? "Active" : "Inactive");
            console.log("\n💡 To activate/deactivate, use the admin panel");
            return;
        }

        // Register the plugin
        const result = await db.insert(plugins).values({
            name: 'lexslider',
            version: '1.0.0',
            isActive: true,
            settings: JSON.stringify({}),
            installedAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        console.log("✅ LexSlider plugin registered successfully!\n");
        console.log("📊 Plugin Details:");
        console.log("   ID:", result[0].id);
        console.log("   Name:", result[0].name);
        console.log("   Version:", result[0].version);
        console.log("   Status: Active");
        console.log("\n🎉 LexSlider is now ready to use!");
        console.log("\n📝 Next steps:");
        console.log("   1. Restart the server: deno task dev");
        console.log("   2. Access admin panel: http://localhost:8000/admincp/plugins/lexslider/sliders");
        console.log("   3. Create a slider via API: POST /api/sliders");
        console.log("   4. View documentation: plugins/lexslider/INSTALL.md");
    } catch (error: any) {
        console.error("❌ Registration failed:", error.message);
        console.error("\n💡 Troubleshooting:");
        console.error("   - Check if database is accessible");
        console.error("   - Verify DATABASE_URL in .env");
        console.error("   - Make sure migrations are applied");
        Deno.exit(1);
    }
}

// Run registration
await registerPlugin();
