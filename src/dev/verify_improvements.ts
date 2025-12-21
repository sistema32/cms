// @ts-nocheck
import * as themeService from "../services/themes/themeService.ts";
import { themeAssetService } from "../services/themes/themeAssetService.ts";
import { themeMarketplaceService } from "../services/themes/themeMarketplaceService.ts";
import * as menuService from "../services/content/menuService.ts";
import * as settingsService from "../services/system/settingsService.ts";

async function verifyAll() {
    console.log("🚀 Starting Comprehensive Verification...\n");

    // 1. Assets
    console.log("--- 1. Testing Asset Pipeline ---");
    themeAssetService.enqueueStyle("main-style", "/css/main.css");
    themeAssetService.enqueueScript("jquery", "/js/jquery.js");
    themeAssetService.enqueueScript("slider", "/js/slider.js", ["jquery"]); // Dep check

    const scripts = themeAssetService.getScripts();
    const styles = themeAssetService.getStyles();

    if (scripts.includes("jquery.js") && scripts.indexOf("jquery.js") < scripts.indexOf("slider.js")) {
        console.log("✅ Asset dependencies resolved correctly.");
    } else {
        console.error("❌ Asset dependency failed:", scripts);
    }

    // 2. Marketplace
    console.log("\n--- 2. Testing Marketplace ---");
    const themes = await themeMarketplaceService.getAvailableThemes();
    if (themes.length > 0) {
        console.log(`✅ Fetched ${themes.length} themes from marketplace.`);
    } else {
        console.error("❌ Failed to fetch themes.");
    }

    // 3. Menus (Locations)
    console.log("\n--- 3. Testing Advanced Menus ---");
    const menuSlug = `test-menu-${Date.now()}`;
    const location = "primary";
    try {
        // Clean up previous if any
        const existing = await menuService.getMenuByLocation(location);
        if (existing) {
            console.log(`ℹ️ Location '${location}' already taken by '${existing.name}'. Using it for test.`);
        } else {
            try {
                await menuService.createMenu({
                    name: "Test Menu",
                    slug: menuSlug,
                    location: location,
                    isActive: true
                });
                console.log(`✅ Created menu with location '${location}'.`);

                const retrieved = await menuService.getMenuByLocation(location);
                if (retrieved && retrieved.slug === menuSlug) {
                    console.log("✅ Retrieved menu by location correctly.");
                } else {
                    console.error("❌ Failed to retrieve menu by location.");
                }
            } catch (e) {
                console.error("Failed to create menu:", e);
            }
        }
    } catch (e) {
        console.error("Menu test error:", e);
    }

    // 4. Safe Mode
    console.log("\n--- 4. Testing Safe Mode ---");
    const activeBefore = await themeService.getActiveTheme();
    console.log(`Current theme: ${activeBefore}`);

    // Activate safe mode
    await themeService.activateSafeMode("Verification Test");

    const activeAfter = await themeService.getActiveTheme();
    console.log(`Theme after Safe Mode: ${activeAfter}`);

    if (activeAfter === "default") {
        console.log("✅ Safe Mode activated successfully (reverted to default).");
    } else {
        console.error("❌ Safe Mode failed to revert theme.");
    }

    // Restore
    if (activeBefore !== "default") {
        console.log(`Restoring original theme: ${activeBefore}`);
        await settingsService.updateSetting("active_theme", activeBefore);
    }
}

verifyAll();
