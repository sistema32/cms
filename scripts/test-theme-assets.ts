#!/usr/bin/env -S deno run --allow-read --allow-net

/**
 * Script to test theme assets are accessible
 * Usage: deno run --allow-read --allow-net scripts/test-theme-assets.ts
 */

const THEMES = ["default", "magazine", "minimalist", "corporate", "base", "modern"];
const BASE_URL = "http://localhost:8000";

console.log("🔍 Testing Theme Assets Accessibility\n");
console.log(`Server: ${BASE_URL}\n`);

async function testAsset(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    const success = response.ok;
    const status = response.status;
    const size = response.headers.get("content-length") || "unknown";

    console.log(
      success ? "✅" : "❌",
      url.replace(BASE_URL, ""),
      `(${status}, ${size} bytes)`
    );

    return success;
  } catch (error) {
    console.log("❌", url.replace(BASE_URL, ""), `(ERROR: ${error.message})`);
    return false;
  }
}

async function testTheme(theme: string): Promise<{ total: number; success: number }> {
  console.log(`\n📂 Testing ${theme} theme:`);

  const assets = [
    `${BASE_URL}/themes/${theme}/assets/css/${theme}.css`,
    `${BASE_URL}/themes/${theme}/assets/js/${theme}.js`,
  ];

  // Default theme uses main.css and main.js
  if (theme === "default") {
    assets[0] = `${BASE_URL}/themes/default/assets/css/main.css`;
    assets[1] = `${BASE_URL}/themes/default/assets/js/main.js`;
  }

  let successCount = 0;

  for (const asset of assets) {
    const success = await testAsset(asset);
    if (success) successCount++;
  }

  return { total: assets.length, success: successCount };
}

async function testExternalResources() {
  console.log("\n🌐 Testing External Resources (CSP):");

  const resources = [
    "https://cdn.tailwindcss.com",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
    "https://fonts.gstatic.com",
  ];

  for (const resource of resources) {
    await testAsset(resource);
  }
}

// Main execution
console.log("⚠️  Make sure the development server is running!");
console.log("   Run: deno task dev\n");

let totalTests = 0;
let totalSuccess = 0;

for (const theme of THEMES) {
  const result = await testTheme(theme);
  totalTests += result.total;
  totalSuccess += result.success;
}

await testExternalResources();

console.log("\n" + "=".repeat(60));
console.log(`📊 Results: ${totalSuccess}/${totalTests} assets accessible`);
console.log("=".repeat(60) + "\n");

if (totalSuccess === totalTests) {
  console.log("✅ All theme assets are accessible!");
  console.log("\nIf themes still look broken:");
  console.log("  1. Clear browser cache (Ctrl+Shift+R)");
  console.log("  2. Open DevTools (F12) and check Console for errors");
  console.log("  3. Check Network tab to see if assets are loading");
  console.log("  4. See CORPORATE_THEME_DEBUG.md for detailed guide");
} else {
  console.log("❌ Some assets are not accessible!");
  console.log("\nTroubleshooting:");
  console.log("  1. Make sure server is running: deno task dev");
  console.log("  2. Check that files exist in src/themes/*/assets/");
  console.log("  3. Verify serveStatic config in src/routes/frontend.ts");
  console.log("  4. See CORPORATE_THEME_DEBUG.md for detailed guide");
  Deno.exit(1);
}
