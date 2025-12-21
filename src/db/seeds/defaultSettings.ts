import * as settingsService from "@/services/system/settingsService.ts";
import { getDefaultSettingValues } from "../../config/settingsDefinitions.ts";

/**
 * Seed de settings por defecto
 * Basado en las categorías de WordPress
 */
export async function seedDefaultSettings() {
  console.log("🌱 Seeding default settings...");

  const defaultSettings: Record<string, any> = getDefaultSettingValues();

  let createdCount = 0;
  let updatedCount = 0;

  for (const [key, value] of Object.entries(defaultSettings)) {
    try {
      // Verificar si ya existe
      const existing = await settingsService.getSetting(key);

      if (existing === null || existing === undefined) {
        // Crear nuevo setting
        await settingsService.createSetting(key, value, true);
        createdCount++;
        console.log(`  ✅ Created: ${key} = ${JSON.stringify(value)}`);
      } else {
        // Ya existe, no sobrescribir
        console.log(`  ⏭️  Skipped: ${key} (already exists)`);
        updatedCount++;
      }
    } catch (error: any) {
      console.error(`  ❌ Error with ${key}:`, error.message);
    }
  }

  console.log(
    `\n✅ Settings seeded: ${createdCount} created, ${updatedCount} skipped`
  );
}

/**
 * Seed de custom settings del theme default
 */
export async function seedDefaultThemeSettings() {
  console.log("\n🎨 Seeding default theme settings...");

  const themeSettings: Record<string, any> = {
    color_scheme: "Light",
    typography: "Modern sans-serif",
    header_style: "Minimal",
    show_sidebar: true,
    primary_color: "#0066cc",
    logo_image: null,
    cta_text: "Suscríbete a nuestro newsletter",
    show_author_bio: true,
  };

  await settingsService.updateThemeCustomSettings("default", themeSettings);

  console.log(`✅ Theme settings seeded: ${Object.keys(themeSettings).length} settings`);
}

/**
 * Ejecutar ambos seeds
 */
export async function seedSettings() {
  await seedDefaultSettings();
  await seedDefaultThemeSettings();
}

// Si se ejecuta directamente
if (import.meta.main) {
  await seedSettings();
  Deno.exit(0);
}
