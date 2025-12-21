// @ts-nocheck
import { themeI18nService } from "../services/themes/themeI18nService.ts";
import { blockService } from "../services/themes/blockService.ts";

async function main() {
    console.log("Starting verification...");

    try {
        // Test I18n
        console.log("\n--- Testing I18n ---");
        // Manually load to ensure it's loaded
        await themeI18nService.loadTranslations("default", "es");

        const t = await themeI18nService.getHelper("default", "es");
        console.log("Translation for 'hello' (expected 'Hola Mundo'):", `"${t("hello")}"`);
        console.log("Translation for 'welcome_message' (param check):", `"${t("welcome_message", { site_name: "LexCMS" })}"`);
        console.log("Translation for 'missing':", `"${t("missing")}"`);

        // Test Blocks
        console.log("\n--- Testing Blocks ---");
        const blocks = await blockService.loadThemeBlocks("default");
        console.log("Blocks loaded:", blocks.length);
        console.log("Blocks array:", blocks);

    } catch (error) {
        console.error("Verification failed:", error);
    }

    console.log("\nVerification complete.");
}

main();
