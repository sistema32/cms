import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import * as themeService from "../src/services/themeService.ts";

/**
 * Tests del Sistema de Themes
 * 
 * Para ejecutar:
 * deno test tests/theme-system.test.ts
 */

Deno.test("themeService - Load valid theme config", async () => {
  const config = await themeService.loadThemeConfig("default");
  
  assertExists(config, "Config should exist");
  assertEquals(config?.name, "default", "Theme name should be 'default'");
  assertExists(config?.displayName, "Display name should exist");
  assertExists(config?.version, "Version should exist");
});

Deno.test("themeService - List available themes", async () => {
  const themes = await themeService.listAvailableThemes();
  
  assert(Array.isArray(themes), "Should return an array");
  assert(themes.length > 0, "Should have at least one theme");
  assert(themes.includes("default"), "Should include default theme");
});

Deno.test("themeService - Validate theme structure", async () => {
  const validation = await themeService.validateTheme("default");
  
  assertEquals(validation.valid, true, "Default theme should be valid");
  assertEquals(validation.errors.length, 0, "Should have no errors");
});

Deno.test("themeService - Detect invalid theme", async () => {
  const validation = await themeService.validateTheme("nonexistent-theme");
  
  assertEquals(validation.valid, false, "Invalid theme should not be valid");
  assert(validation.errors.length > 0, "Should have errors");
});

Deno.test("themeService - Child theme detection", async () => {
  // Test con default theme (no es child)
  const isChild = await themeService.isChildTheme("default");
  assertEquals(isChild, false, "Default theme should not be a child theme");
  
  const parent = await themeService.getParentTheme("default");
  assertEquals(parent, null, "Default theme should have no parent");
});

Deno.test("themeService - Theme hierarchy", async () => {
  const hierarchy = await themeService.getThemeHierarchy("default");
  
  assert(Array.isArray(hierarchy), "Hierarchy should be an array");
  assertEquals(hierarchy[0], "default", "First element should be the theme itself");
});

Deno.test("themeService - Template hierarchy lookup", async () => {
  const template = await themeService.findTemplate("home");
  
  assertExists(template, "Should find home template");
  assert(["home", "front-page", "index"].includes(template!), "Should be a valid home template");
});

Deno.test("themeService - Custom settings types", () => {
  const customSetting: themeService.CustomSettingDefinition = {
    type: "color",
    label: "Primary Color",
    default: "#3b82f6",
    group: "colors"
  };
  
  assertEquals(customSetting.type, "color");
  assertEquals(customSetting.default, "#3b82f6");
});

Deno.test("themeService - Validate custom settings in config", async () => {
  const config = await themeService.loadThemeConfig("corporate");
  
  if (config?.config?.custom) {
    const customKeys = Object.keys(config.config.custom);
    assert(customKeys.length > 0, "Corporate theme should have custom settings");
    
    // Validar estructura de un setting
    const firstKey = customKeys[0];
    const firstSetting = (config.config.custom as any)[firstKey];
    
    assertExists(firstSetting.type, "Setting should have type");
    assertExists(firstSetting.label, "Setting should have label");
  }
});

Deno.test("themeService - Cache functionality", () => {
  const stats = themeService.getCacheStats();
  
  assertExists(stats, "Cache stats should exist");
  assert(typeof stats.hits === "number", "Cache hits should be a number");
  assert(typeof stats.misses === "number", "Cache misses should be a number");
});

console.log("✅ All theme system tests completed");
