#!/usr/bin/env -S deno run --allow-all

/**
 * Plugin System Diagnostic Test
 */

import { db } from "./src/config/db.ts";
import { plugins } from "./src/db/schema.ts";
import { pluginManager } from "./src/lib/plugin-system/index.ts";
import { pluginLoader } from "./src/lib/plugin-system/PluginLoader.ts";

console.log("🔍 Testing Plugin System...\n");

// Test 1: Check database tables
console.log("1️⃣ Checking database tables...");
try {
  const result = await db.select().from(plugins).all();
  console.log(`   ✅ plugins table exists`);
  console.log(`   📊 Found ${result.length} installed plugins in database`);
  if (result.length > 0) {
    result.forEach((p) => {
      console.log(`      - ${p.name} v${p.version} (${p.isActive ? "active" : "inactive"})`);
    });
  }
} catch (error) {
  console.error(`   ❌ Error accessing plugins table:`, error);
}

console.log("");

// Test 2: Discover available plugins
console.log("2️⃣ Discovering available plugins...");
try {
  const available = await pluginLoader.discoverPlugins();
  console.log(`   ✅ Found ${available.length} plugins in plugins directory`);
  if (available.length > 0) {
    for (const name of available) {
      console.log(`      - ${name}`);
      try {
        const manifest = await pluginLoader.loadManifest(name);
        console.log(`        ${manifest.displayName} v${manifest.version}`);
        console.log(`        ${manifest.description}`);
      } catch (error) {
        console.error(`        ❌ Error loading manifest:`, error.message);
      }
    }
  }
} catch (error) {
  console.error(`   ❌ Error discovering plugins:`, error);
}

console.log("");

// Test 3: Check available plugins (not installed)
console.log("3️⃣ Checking available plugins (not installed)...");
try {
  const available = await pluginManager.discoverAvailable();
  console.log(`   ✅ Found ${available.length} plugins available for installation`);
  if (available.length > 0) {
    available.forEach((name) => {
      console.log(`      - ${name}`);
    });
  }
} catch (error) {
  console.error(`   ❌ Error checking available plugins:`, error);
}

console.log("");

// Test 4: Initialize plugin system
console.log("4️⃣ Initializing plugin system...");
try {
  await pluginManager.initialize();
  console.log(`   ✅ Plugin system initialized successfully`);

  const stats = await pluginManager.getStats();
  console.log(`   📊 Stats: ${stats.total} total, ${stats.active} active, ${stats.inactive} inactive`);
} catch (error) {
  console.error(`   ❌ Error initializing plugin system:`, error);
  console.error(error.stack);
}

console.log("");

// Test 5: Try to install a plugin
console.log("5️⃣ Testing plugin installation (cdn-cloudflare)...");
try {
  const available = await pluginLoader.discoverPlugins();
  if (available.includes("cdn-cloudflare")) {
    const isInstalled = await pluginManager.isInstalled("cdn-cloudflare");

    if (isInstalled) {
      console.log(`   ℹ️  Plugin cdn-cloudflare is already installed`);

      // Test getting details
      const allPlugins = await pluginManager.getAll();
      const plugin = allPlugins.find(p => p.name === "cdn-cloudflare");
      if (plugin) {
        console.log(`      Name: ${plugin.name}`);
        console.log(`      Version: ${plugin.version}`);
        console.log(`      Active: ${plugin.isActive}`);
        console.log(`      Installed: ${plugin.installedAt}`);
      }
    } else {
      console.log(`   ℹ️  Plugin cdn-cloudflare not installed, attempting installation...`);
      const plugin = await pluginManager.install("cdn-cloudflare", { activate: false });
      console.log(`   ✅ Plugin installed successfully!`);
      console.log(`      Name: ${plugin.name}`);
      console.log(`      Version: ${plugin.version}`);
      console.log(`      Status: ${plugin.status}`);
    }
  } else {
    console.log(`   ⚠️  Plugin cdn-cloudflare not found in plugins directory`);
  }
} catch (error) {
  console.error(`   ❌ Error installing plugin:`, error);
  console.error(error.stack);
}

console.log("\n✅ Plugin system diagnostic complete!");
